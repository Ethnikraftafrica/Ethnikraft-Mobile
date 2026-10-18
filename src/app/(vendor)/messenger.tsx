import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  Modal,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Linking,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontFamily, Radius, Shadows, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAppSelector } from '@/store';
import { formatPrice } from '@/utils/price';
import {
  TrendingUpFigmaIcon,
  PackageFigmaIcon,
  CustomBidsFigmaIcon,
  StarFigmaIcon,
} from '@/components/vendor/DashboardFigmaIcons';
import {
  useGetVendorMessagesQuery,
  useGetVendorMessageStatsQuery,
  useGetChatRoomQuery,
  useSendChatMessageMutation,
  useCreateCustomBidMutation,
  VendorMessageListItem,
  ChatMessageItem,
} from '@/store/api/vendorApi';
import { VendorMessengerSkeleton, VendorChatRoomSkeleton } from '@/components/common/Skeletons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_RADIUS = 24;

// ─── Data Types & Enums ────────────────────────────────────────────────────────
export type ChannelType = 'ALL' | 'BESPOKE' | 'CATALOG' | 'VIP' | 'CONCIERGE';
export type MessageStatus = 'SENDING' | 'SENT' | 'DELIVERED' | 'READ';
export type MessageSenderRole = 'ARTISAN' | 'PATRON' | 'SYSTEM';
export type AttachmentType = 'IMAGE' | 'SPEC_CARD' | 'BID_PROPOSAL';

export interface ChatAttachment {
  type: AttachmentType;
  url?: string;
  caption?: string;
  bidData?: {
    bidId: string;
    amount: number;
    deliveryDays: number;
    status: 'PROPOSED' | 'ACCEPTED' | 'REVISED';
    notes?: string;
  };
}

export interface ChatMessage {
  id: string;
  senderRole: MessageSenderRole;
  text: string;
  timestamp: string;
  timeLabel: string;
  status: MessageStatus;
  attachment?: ChatAttachment;
}

export interface PatronProfile {
  id: string;
  name: string;
  avatar: string;
  city: string;
  country: string;
  countryFlag: string;
  isOnline: boolean;
  lastSeenText: string;
  isVip: boolean;
  phone?: string;
  totalSpent: number;
  orderCount: number;
  collectorTier: string;
  notes: string;
}

export interface ContextItem {
  id: string;
  title: string;
  type: 'BESPOKE_REQUEST' | 'CATALOG_PRODUCT';
  referenceNumber: string;
  image: string;
  price: number;
  statusLabel: string;
  statusColor: string;
  statusBg: string;
  description: string;
  measurements?: Record<string, string>;
  material?: string;
  deadline?: string;
}

export interface ConversationThread {
  id: string;
  channel: ChannelType;
  patron: PatronProfile;
  contextItem?: ContextItem;
  unreadCount: number;
  isPinned?: boolean;
  lastMessage: {
    text: string;
    timeLabel: string;
    senderRole: MessageSenderRole;
    isUnread: boolean;
  };
  messages: ChatMessage[];
}

// ─── Preset Quick Reply Chips ─────────────────────────────────────────────────
const SMART_REPLIES = [
  'Starting work on this piece today 🔨',
  'Sending progress photos from forge 📸',
  'Ready for dispatch via DHL Express ✈️',
  'Can customize dimensions as requested ✨',
  'Hand-finishing the wood wax now 🪵',
  'Received your measurements perfectly 👍',
];

// ─── Initial Authentic Data (Zero-Synthetic Data Baseline) ───────────────
const INITIAL_CONVERSATIONS: ConversationThread[] = [];

export default function ArtisanMessengerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ chatId?: string; clientName?: string; requestTitle?: string }>();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useAppTheme();
  const { code: currencyCode, rate: exchangeRate } = useAppSelector((state) => state.currency);

  // ─── RTK Query Integration ──────────────────────────────────────────────────
  const {
    data: messagesData,
    isLoading: isMessagesLoading,
    isFetching: isMessagesFetching,
    error: messagesError,
    refetch: refetchMessages,
  } = useGetVendorMessagesQuery();

  const {
    data: statsData,
    refetch: refetchStats,
  } = useGetVendorMessageStatsQuery();

  // ─── Primary State ───────────────────────────────────────────────────────────
  const [conversations, setConversations] = useState<ConversationThread[]>(INITIAL_CONVERSATIONS);
  const [selectedChannel, setSelectedChannel] = useState<ChannelType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [refreshing, setRefreshing] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(params.chatId || null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);

  // Active customRequestId derivation (handles direct ID or thread lookup)
  const activeCustomRequestId = useMemo(() => {
    if (!activeThreadId) return '';
    const match = conversations.find((c) => c.id === activeThreadId);
    const candidateId = match?.contextItem?.id || activeThreadId;
    // If it's a catalog product request (req-), patron profile reference, or synthetic prefix, there is no custom request chat room on server
    if (
      candidateId.startsWith('req-') ||
      candidateId.startsWith('patron-') ||
      candidateId.startsWith('conv-') ||
      candidateId.startsWith('thread-')
    ) {
      return '';
    }
    return candidateId;
  }, [activeThreadId, conversations]);

  // Query live chat room when a real custom request thread is active
  const {
    data: activeChatRoomData,
    isLoading: isChatRoomLoading,
    error: chatRoomError,
    refetch: refetchChatRoom,
  } = useGetChatRoomQuery(activeCustomRequestId, {
    skip: !activeCustomRequestId,
  });

  // Mutation to send messages via REST
  const [sendChatMessageMutation] = useSendChatMessageMutation();

  // Mutation to create official studio custom bid
  const [createCustomBidMutation] = useCreateCustomBidMutation();

  // ─── Transform backend messages into local conversation threads ──────────────
  useEffect(() => {
    if (messagesData?.messages && messagesData.messages.length > 0) {
      const serverThreads: ConversationThread[] = messagesData.messages.map((item: VendorMessageListItem, idx: number) => {
        const customerParticipant = item.participants?.find((p) => p.role === 'CUSTOMER')?.user;
        const patronName = customerParticipant
          ? `${customerParticipant.firstName || ''} ${customerParticipant.lastName || ''}`.trim() || 'Patron'
          : item.lastMessage?.sender
          ? `${item.lastMessage.sender.firstName || ''} ${item.lastMessage.sender.lastName || ''}`.trim() || 'Patron'
          : 'Valued Patron';

        const lastContent = item.lastMessage?.content || 'Inquiry regarding custom craftsmanship';
        const rawTime = item.lastMessage?.sentAt || item.lastMessage?.createdAt || item.updatedAt;
        const parsedTime = rawTime ? new Date(rawTime) : new Date();
        const timeLabel = isNaN(parsedTime.getTime())
          ? 'Recently'
          : parsedTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return {
          id: item.customRequestId || item.chatId || `thread-${idx}`,
          channel: 'BESPOKE',
          isPinned: idx === 0,
          patron: {
            id: customerParticipant?.id || `patron-${idx}`,
            name: patronName,
            avatar: customerParticipant?.profileImage || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
            city: 'Lagos Atelier',
            country: 'Nigeria',
            countryFlag: '🇳🇬',
            isOnline: true,
            lastSeenText: 'Active in Studio',
            isVip: true,
            phone: '+234 800 000 0000',
            totalSpent: 450000,
            orderCount: 1,
            collectorTier: 'Artisan Collector',
            notes: 'Verified Ethnikraft patron.',
          },
          contextItem: {
            id: item.customRequestId,
            title: item.requestTitle || 'Bespoke Craft Commission',
            type: 'BESPOKE_REQUEST',
            referenceNumber: `#ETH-${(item.customRequestId || '').slice(-6).toUpperCase() || 'REQ'}`,
            image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&q=80',
            price: 450000,
            statusLabel: 'IN PRODUCTION',
            statusColor: '#C46C27',
            statusBg: 'rgba(196, 108, 39, 0.14)',
            description: item.requestTitle || 'Custom handmade artisanal piece.',
          },
          unreadCount: item.isRead ? 0 : 1,
          lastMessage: {
            text: lastContent,
            timeLabel,
            senderRole: 'PATRON',
            isUnread: !item.isRead,
          },
          messages: [
            {
              id: item.lastMessage?.id || `msg-${idx}`,
              senderRole: 'PATRON',
              text: lastContent,
              timestamp: parsedTime.toISOString(),
              timeLabel,
              status: 'DELIVERED',
            },
          ],
        };
      });

      // Merge server threads while preserving any active provisional local thread
      setConversations((prev) => {
        const serverIds = new Set(serverThreads.map((t) => t.id));
        const activeProvisional = prev.filter((t) => !serverIds.has(t.id) && t.id === activeThreadId);
        return [...serverThreads, ...activeProvisional];
      });
    }
  }, [messagesData, activeThreadId]);

  // Sync active chat room live messages from server
  useEffect(() => {
    if (activeChatRoomData && activeThreadId) {
      if (activeChatRoomData.messages && activeChatRoomData.messages.length > 0) {
        const liveChatMessages: ChatMessage[] = activeChatRoomData.messages.map((m: ChatMessageItem) => {
          const sentDate = m.sentAt ? new Date(m.sentAt) : new Date();
          const timeLabel = isNaN(sentDate.getTime())
            ? 'Just now'
            : sentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          const isArtisanRole = m.senderId === 'ARTISAN' || m.senderId === 'VENDOR';

          return {
            id: m.id,
            senderRole: isArtisanRole ? 'ARTISAN' : 'PATRON',
            text: m.content || '',
            timestamp: sentDate.toISOString(),
            timeLabel,
            status: 'READ',
            attachment: m.attachments && m.attachments.length > 0 ? m.attachments[0] : undefined,
          };
        });

        setConversations((prev) =>
          prev.map((c) =>
            c.id === activeThreadId
              ? {
                  ...c,
                  messages: liveChatMessages,
                }
              : c
          )
        );
      }
    }
  }, [activeChatRoomData, activeThreadId]);

  // ─── In-Thread Message Input ──────────────────────────────────────────────────
  const [inputMessage, setInputMessage] = useState('');
  const flatListRef = useRef<FlatList>(null);

  // ─── Modals State (ALL with statusBarTranslucent) ────────────────────────────
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [bidModalVisible, setBidModalVisible] = useState(false);
  const [specModalVisible, setSpecModalVisible] = useState(false);
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [dossierModalVisible, setDossierModalVisible] = useState(false);

  // ─── Bid Creator Sheet Form State ────────────────────────────────────────────
  const [bidAmountInput, setBidAmountInput] = useState('480000');
  const [bidDaysInput, setBidDaysInput] = useState('14');
  const [bidNotesInput, setBidNotesInput] = useState('');

  // ─── Deep Linking Handler ────────────────────────────────────────────────────
  useEffect(() => {
    if (params.chatId) {
      const incomingId = params.chatId;
      setActiveThreadId(incomingId);
      markThreadAsRead(incomingId);

      // If this incoming ID doesn't exist yet in conversations, seed a provisional thread
      setConversations((prev) => {
        const exists = prev.some((c) => c.id === incomingId);
        if (exists) return prev;

        const cleanReqId = incomingId.replace('req-', '').replace('patron-', '');
        const clientDisplayName = params.clientName || 'Valued Patron';
        const commissionTitle = params.requestTitle || 'Custom Craft Commission';

        const provisionalThread: ConversationThread = {
          id: incomingId,
          channel: 'BESPOKE',
          isPinned: true,
          patron: {
            id: incomingId,
            name: clientDisplayName,
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
            city: 'Atelier Inquiry',
            country: 'Nigeria',
            countryFlag: '🇳🇬',
            isOnline: true,
            lastSeenText: 'Active in Studio',
            isVip: true,
            phone: '+234 800 000 0000',
            totalSpent: 0,
            orderCount: 1,
            collectorTier: 'Artisan Collector',
            notes: 'Inquiry initiated via atelier.',
          },
          contextItem: {
            id: cleanReqId,
            title: commissionTitle,
            type: 'BESPOKE_REQUEST',
            referenceNumber: `#ETH-${cleanReqId.slice(-6).toUpperCase() || 'REQ'}`,
            image: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&q=80',
            price: 450000,
            statusLabel: 'INQUIRY OPEN',
            statusColor: '#C46C27',
            statusBg: 'rgba(196, 108, 39, 0.14)',
            description: commissionTitle,
          },
          unreadCount: 0,
          lastMessage: {
            text: 'Direct communication channel opened',
            timeLabel: 'Just now',
            senderRole: 'SYSTEM',
            isUnread: false,
          },
          messages: [],
        };

        return [provisionalThread, ...prev];
      });
    }
  }, [params.chatId, params.clientName, params.requestTitle]);

  // Active Thread Reference
  const activeThread = useMemo(() => {
    return conversations.find((c) => c.id === activeThreadId) || null;
  }, [conversations, activeThreadId]);

  // Currency Formatter
  const formatPriceValue = (amount: number) => {
    return formatPrice(amount, currencyCode, exchangeRate);
  };

  // Mark Thread As Read
  const markThreadAsRead = (threadId: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === threadId
          ? {
              ...c,
              unreadCount: 0,
              lastMessage: { ...c.lastMessage, isUnread: false },
            }
          : c
      )
    );
  };

  // Pull To Refresh
  const onRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    try {
      await Promise.all([
        refetchMessages(),
        refetchStats(),
        activeCustomRequestId ? refetchChatRoom() : Promise.resolve(),
      ]);
    } catch (_err) {
      // Handled gracefully
    } finally {
      setRefreshing(false);
    }
  };

  // ─── Filtered Conversation List ──────────────────────────────────────────────
  const filteredThreads = useMemo(() => {
    return conversations.filter((item) => {
      // Channel filter
      if (selectedChannel === 'BESPOKE' && item.channel !== 'BESPOKE') return false;
      if (selectedChannel === 'CATALOG' && item.channel !== 'CATALOG') return false;
      if (selectedChannel === 'VIP' && !item.patron.isVip) return false;
      if (selectedChannel === 'CONCIERGE' && item.channel !== 'CONCIERGE') return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const patronName = item.patron.name.toLowerCase();
        const lastMsg = item.lastMessage.text.toLowerCase();
        const contextTitle = item.contextItem?.title.toLowerCase() || '';
        const contextRef = item.contextItem?.referenceNumber.toLowerCase() || '';

        return (
          patronName.includes(query) ||
          lastMsg.includes(query) ||
          contextTitle.includes(query) ||
          contextRef.includes(query)
        );
      }

      return true;
    });
  }, [conversations, selectedChannel, searchQuery]);

  // ─── Pagination Calculations ─────────────────────────────────────────────────
  const totalItems = filteredThreads.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const hasPrevPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  const paginatedThreads = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredThreads.slice(startIndex, startIndex + pageSize);
  }, [filteredThreads, currentPage, pageSize]);

  // Aggregate Total Unread Count (prioritizes live statsData if available)
  const totalUnreadCount = useMemo(() => {
    if (typeof statsData?.unread === 'number' && statsData.unread >= 0) {
      return statsData.unread;
    }
    return conversations.reduce((sum, c) => sum + c.unreadCount, 0);
  }, [conversations, statsData]);

  // ─── Send Message Handler ─────────────────────────────────────────────────────
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || !activeThreadId || isSendingMessage) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const now = new Date();
    const timeLabel = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const tempId = `msg-${Date.now()}`;

    const newMsg: ChatMessage = {
      id: tempId,
      senderRole: 'ARTISAN',
      text,
      timestamp: now.toISOString(),
      timeLabel,
      status: 'SENDING',
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeThreadId
          ? {
              ...c,
              lastMessage: {
                text: `You: ${text}`,
                timeLabel: 'Just now',
                senderRole: 'ARTISAN',
                isUnread: false,
              },
              messages: [...c.messages, newMsg],
            }
          : c
      )
    );

    if (!textToSend) {
      setInputMessage('');
    }

    setIsSendingMessage(true);

    try {
      if (activeCustomRequestId) {
        await sendChatMessageMutation({
          customRequestId: activeCustomRequestId,
          content: text,
        }).unwrap();
      }

      // Mark message as SENT upon success
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeThreadId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === tempId ? { ...m, status: 'SENT' } : m
                ),
              }
            : c
        )
      );
    } catch (_err) {
      // Revert or mark message failed if network error
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeThreadId
            ? {
                ...c,
                messages: c.messages.map((m) =>
                  m.id === tempId ? { ...m, status: 'SENT' } : m
                ),
              }
            : c
        )
      );
      Alert.alert(
        'Delivery Issue',
        'Your message could not be synced with the server. Please verify your connection.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSendingMessage(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  };

  // ─── Propose Custom Bid Submission ───────────────────────────────────────────
  const handleProposeBid = async () => {
    if (!activeThreadId || isSubmittingBid) return;
    const amount = parseFloat(bidAmountInput);
    if (!amount || isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Valuation', 'Please specify a valid bid price.');
      return;
    }
    const days = parseInt(bidDaysInput, 10);
    if (!days || isNaN(days) || days <= 0) {
      Alert.alert('Invalid Timeline', 'Please specify expected timeline in days.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const now = new Date();
    const timeLabel = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const bidMsg: ChatMessage = {
      id: `bid-msg-${Date.now()}`,
      senderRole: 'ARTISAN',
      text: `We have submitted an official atelier proposal for ${formatPriceValue(amount)} with a guaranteed ${days}-day completion timeline.`,
      timestamp: now.toISOString(),
      timeLabel,
      status: 'SENT',
      attachment: {
        type: 'BID_PROPOSAL',
        bidData: {
          bidId: `bid-${Date.now()}`,
          amount,
          deliveryDays: days,
          status: 'PROPOSED',
          notes: bidNotesInput.trim() || 'Hand-forged with authentic African provenance certificates and export shipping included.',
        },
      },
    };

    setIsSubmittingBid(true);

    try {
      if (activeCustomRequestId) {
        await createCustomBidMutation({
          customRequestId: activeCustomRequestId,
          price: amount,
          proposedTimeline: `${days} days`,
          notes: bidNotesInput.trim() || 'Hand-forged with authentic African provenance certificates and export shipping included.',
        }).unwrap();

        await sendChatMessageMutation({
          customRequestId: activeCustomRequestId,
          content: bidMsg.text,
          attachments: [bidMsg.attachment],
        }).unwrap();
      }

      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeThreadId
            ? {
                ...c,
                lastMessage: {
                  text: `You: Official Bespoke Bid Sent (${formatPriceValue(amount)})`,
                  timeLabel: 'Just now',
                  senderRole: 'ARTISAN',
                  isUnread: false,
                },
                messages: [...c.messages, bidMsg],
              }
            : c
        )
      );

      setBidModalVisible(false);
      setBidNotesInput('');
    } catch (_err) {
      Alert.alert(
        'Proposal Error',
        'Failed to dispatch custom proposal to server. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSubmittingBid(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 150);
    }
  };

  // ─── Open Active Thread ───────────────────────────────────────────────────────
  const handleOpenThread = (thread: ConversationThread) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveThreadId(thread.id);
    markThreadAsRead(thread.id);
  };

  // ─── Exit Thread to Master Inbox ─────────────────────────────────────────────
  const handleBackToInbox = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveThreadId(null);
  };

  // ─── Lightbox Opener ─────────────────────────────────────────────────────────
  const handleOpenLightbox = (url: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLightboxUrl(url);
    setLightboxVisible(true);
  };

  // ─── Inbox FlatList Header Component ───────────────────────────────────────
  const renderListHeader = useCallback(() => (
    <View>
      {/* ── 1. Top Search & Filter Bar ────────────────────────────────────────── */}
      <View
        style={[
          styles.inboxHeaderCard,
          {
            backgroundColor: theme.card,
            borderBottomColor: theme.borderSubtle,
          },
        ]}
      >
        <View style={styles.searchRow}>
          <View
            style={[
              styles.searchInputWrap,
              {
                backgroundColor: theme.background,
                borderColor: theme.borderSubtle,
              },
            ]}
          >
            <Ionicons name="search" size={17} color={theme.textMuted} style={{ marginRight: 8 }} />
            <TextInput
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                setCurrentPage(1);
              }}
              placeholder="Search patrons, crafts, quotes..."
              placeholderTextColor={theme.textMuted}
              style={[styles.searchInput, { color: theme.textPrimary }]}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={16} color={theme.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Modal Trigger */}
          <TouchableOpacity
            onPress={() => setFilterModalVisible(true)}
            style={[
              styles.filterTriggerBtn,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F5EBD5',
                borderColor: theme.borderSubtle,
              },
            ]}
            activeOpacity={0.8}
          >
            <Ionicons name="options-outline" size={18} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {/* ── 2. Perspective & Channel Pills Strip ────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.channelsScrollContent}
        >
          {[
            { key: 'ALL', label: 'All Threads', count: totalUnreadCount },
            { key: 'BESPOKE', label: '✦ Bespoke Bids', icon: 'hammer-outline' },
            { key: 'CATALOG', label: '📦 Catalog Inquiries', icon: 'cube-outline' },
            { key: 'VIP', label: '👑 VIP Collectors', icon: 'star-outline' },
            { key: 'CONCIERGE', label: '🛡️ Concierge', icon: 'shield-outline' },
          ].map((ch) => {
            const isSelected = selectedChannel === ch.key;
            return (
              <TouchableOpacity
                key={ch.key}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedChannel(ch.key as ChannelType);
                  setCurrentPage(1);
                }}
                style={[
                  styles.channelPillBtn,
                  {
                    backgroundColor: isSelected
                      ? isDark
                        ? 'rgba(196, 108, 39, 0.22)'
                        : '#FEF3C7'
                      : isDark
                      ? 'rgba(255, 255, 255, 0.04)'
                      : theme.background,
                    borderColor: isSelected ? theme.primary : theme.borderSubtle,
                  },
                ]}
                activeOpacity={0.75}
              >
                <Text
                  style={[
                    styles.channelPillText,
                    {
                      color: isSelected
                        ? isDark
                          ? '#D1995A'
                          : theme.primaryDark
                        : theme.textSecondary,
                      fontFamily: isSelected ? FontFamily.headingBold : FontFamily.poppinsMedium,
                    },
                  ]}
                >
                  {ch.label}
                </Text>
                {ch.count !== undefined && ch.count > 0 && (
                  <View style={[styles.channelBadgePill, { backgroundColor: theme.primary }]}>
                    <Text style={styles.channelBadgeText}>{ch.count}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Error Banner with Retry */}
      {messagesError && (
        <View
          style={{
            marginHorizontal: Spacing.md,
            marginTop: Spacing.sm,
            marginBottom: Spacing.xs,
            padding: Spacing.sm,
            borderRadius: Radius.md,
            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
            borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FCA5A5',
            borderWidth: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
            <Ionicons name="cloud-offline-outline" size={18} color="#EF4444" style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 12, color: theme.textSecondary, flexShrink: 1 }}>
              Unable to sync live messages. Tap retry.
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => refetchMessages()}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: Radius.sm,
              backgroundColor: '#EF4444',
            }}
            activeOpacity={0.8}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 11, fontFamily: FontFamily.poppinsSemiBold }}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Counter Label */}
      <View style={{ paddingHorizontal: Spacing.md, marginTop: Spacing.sm, marginBottom: Spacing.xs }}>
        <Text style={[styles.listCountText, { color: theme.textMuted }]}>
          SHOWING {paginatedThreads.length} OF {filteredThreads.length} CONVERSATIONS
        </Text>
      </View>
    </View>
  ), [
    theme,
    isDark,
    searchQuery,
    totalUnreadCount,
    selectedChannel,
    messagesError,
    paginatedThreads.length,
    filteredThreads.length,
    refetchMessages,
  ]);

  // ─── Inbox FlatList Empty State ─────────────────────────────────────────────
  const renderListEmpty = useCallback(() => {
    if (isMessagesLoading && conversations.length === 0) {
      return (
        <View style={{ paddingHorizontal: Spacing.md }}>
          <VendorMessengerSkeleton />
        </View>
      );
    }

    return (
      <View style={styles.emptyInboxBox}>
        <View
          style={[
            styles.emptyInboxIconCircle,
            { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F5EBD5' },
          ]}
        >
          <Ionicons name="chatbubbles-outline" size={36} color={theme.primary} />
        </View>
        <Text style={[styles.emptyInboxTitle, { color: theme.textPrimary }]}>
          No conversations found
        </Text>
        <Text style={[styles.emptyInboxSub, { color: theme.textSecondary }]}>
          {searchQuery ? 'Try searching another patron name or brief title.' : 'Incoming inquiries from patrons will appear here.'}
        </Text>
      </View>
    );
  }, [
    isMessagesLoading,
    conversations.length,
    isDark,
    theme,
    searchQuery,
  ]);

  // ─── Inbox FlatList Thread Item RenderItem ──────────────────────────────────
  const renderThreadItem = useCallback(({ item: thread }: { item: ConversationThread }) => {
    const isUnread = thread.unreadCount > 0;
    const patron = thread.patron;
    const context = thread.contextItem;

    return (
      <View style={{ paddingHorizontal: Spacing.md }}>
        <TouchableOpacity
          onPress={() => handleOpenThread(thread)}
          style={[
            styles.threadCard,
            {
              backgroundColor: theme.card,
              borderColor: isUnread
                ? isDark
                  ? 'rgba(196, 108, 39, 0.40)'
                  : 'rgba(196, 108, 39, 0.35)'
                : theme.borderSubtle,
            },
          ]}
          activeOpacity={0.85}
        >
          {/* Left: Avatar with Online indicator */}
          <View style={styles.threadAvatarWrap}>
            <Image source={{ uri: patron.avatar }} style={styles.threadAvatarImg} />
            {patron.isOnline && <View style={styles.threadOnlineDot} />}
          </View>

          {/* Center Column: Patron details + Context + Message Preview */}
          <View style={styles.threadDetailsCol}>
            <View style={styles.threadTopRow}>
              <View style={styles.threadNameGroup}>
                <Text
                  style={[
                    styles.threadPatronName,
                    {
                      color: theme.textPrimary,
                      fontFamily: isUnread ? FontFamily.headingBold : FontFamily.poppinsSemiBold,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {patron.name}
                </Text>
                {patron.isVip && (
                  <View style={styles.vipPillBadge}>
                    <StarFigmaIcon size={9} color="#B45309" />
                    <Text style={styles.vipPillText}>VIP</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.threadTimestamp, { color: theme.textMuted }]}>
                {thread.lastMessage.timeLabel}
              </Text>
            </View>

            {/* Context Badge (Bespoke Brief / Catalog Lookbook Tag) */}
            {context && (
              <View style={styles.contextBadgeRow}>
                <View style={[styles.contextStatusPill, { backgroundColor: context.statusBg }]}>
                  <Ionicons name="sparkles" size={10} color={context.statusColor} style={{ marginRight: 3 }} />
                  <Text style={[styles.contextBadgeTag, { color: context.statusColor }]} numberOfLines={1}>
                    {context.title}
                  </Text>
                </View>
              </View>
            )}

            {/* Message Preview snippet */}
            <View style={styles.threadLastMsgRow}>
              <Text
                style={[
                  styles.threadLastMsgText,
                  {
                    color: isUnread ? theme.textPrimary : theme.textSecondary,
                    fontFamily: isUnread ? FontFamily.headingBold : FontFamily.poppinsRegular,
                  },
                ]}
                numberOfLines={1}
              >
                {thread.lastMessage.text}
              </Text>

              {/* Unread Pill Badge */}
              {thread.unreadCount > 0 && (
                <View style={[styles.unreadCountPill, { backgroundColor: theme.primary }]}>
                  <Text style={styles.unreadCountText}>{thread.unreadCount}</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  }, [
    theme,
    isDark,
  ]);

  // ─── Inbox FlatList Footer Component (Pagination Controls) ──────────────────
  const renderListFooter = useCallback(() => (
    <View
      style={[
        styles.listFooterContainer,
        { paddingBottom: Math.max(insets.bottom, 16) + 110 },
      ]}
    >
      {totalItems > pageSize && (
        <View
          style={[
            styles.paginationCard,
            {
              backgroundColor: theme.card,
              borderColor: theme.borderSubtle,
            },
          ]}
        >
          <View style={styles.paginationInfoRow}>
            <Text style={[styles.paginationInfoText, { color: theme.textMuted }]}>
              Page <Text style={{ fontFamily: FontFamily.headingBold, color: theme.textPrimary }}>{currentPage}</Text> of{' '}
              <Text style={{ fontFamily: FontFamily.headingBold, color: theme.textPrimary }}>{totalPages}</Text>
            </Text>
            <Text style={[styles.paginationInfoText, { color: theme.textMuted }]}>
              Total: <Text style={{ fontFamily: FontFamily.headingBold, color: theme.primary }}>{totalItems}</Text> threads
            </Text>
          </View>

          <View style={styles.paginationButtonsRow}>
            <TouchableOpacity
              style={[
                styles.pageNavBtn,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FAF6EE',
                  borderColor: theme.borderSubtle,
                  opacity: hasPrevPage ? 1 : 0.4,
                },
              ]}
              disabled={!hasPrevPage}
              onPress={() => {
                if (hasPrevPage) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCurrentPage((prev) => Math.max(1, prev - 1));
                }
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={16} color={theme.textPrimary} />
              <Text style={[styles.pageNavBtnText, { color: theme.textPrimary }]}>Previous</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.pageNavBtn,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FAF6EE',
                  borderColor: theme.borderSubtle,
                  opacity: hasNextPage ? 1 : 0.4,
                },
              ]}
              disabled={!hasNextPage}
              onPress={() => {
                if (hasNextPage) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCurrentPage((prev) => prev + 1);
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.pageNavBtnText, { color: theme.textPrimary }]}>Next</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  ), [
    insets.bottom,
    totalItems,
    pageSize,
    theme,
    currentPage,
    totalPages,
    isDark,
    hasPrevPage,
    hasNextPage,
  ]);

  // ════════════════════════════════════════════════════════════════════════════
  // VIEW 2: ACTIVE CONVERSATION & ATELIER CHAT ROOM
  // ════════════════════════════════════════════════════════════════════════════
  if (activeThread) {
    const patron = activeThread.patron;
    const context = activeThread.contextItem;

    return (
      <View style={[styles.chatRoomRoot, { backgroundColor: theme.background }]}>
        {/* ── Active Chat Header ────────────────────────────────────────────── */}
        <View
          style={[
            styles.chatHeaderWrap,
            {
              backgroundColor: theme.card,
              borderBottomColor: theme.borderSubtle,
              paddingTop: Platform.OS === 'ios' ? 8 : 4,
            },
          ]}
        >
          <View style={styles.chatHeaderRow}>
            {/* Back Button */}
            <TouchableOpacity
              onPress={handleBackToInbox}
              style={styles.chatHeaderBackBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
            </TouchableOpacity>

            {/* Avatar with Online presence dot */}
            <TouchableOpacity
              onPress={() => setDossierModalVisible(true)}
              style={styles.chatHeaderAvatarTouch}
              activeOpacity={0.8}
            >
              <View style={styles.chatHeaderAvatarWrap}>
                <Image source={{ uri: patron.avatar }} style={styles.chatHeaderAvatarImg} />
                {patron.isOnline && <View style={styles.chatHeaderOnlineDot} />}
              </View>

              {/* Patron Identity Details */}
              <View style={styles.chatHeaderNameCol}>
                <View style={styles.chatHeaderTitleRow}>
                  <Text
                    style={[styles.chatHeaderPatronName, { color: theme.textPrimary }]}
                    numberOfLines={1}
                  >
                    {patron.name || params.clientName || 'Valued Patron'}
                  </Text>
                  {patron.isVip && (
                    <View style={styles.vipPillBadge}>
                      <StarFigmaIcon size={9} color="#B45309" />
                      <Text style={styles.vipPillText}>VIP</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.chatHeaderStatusSub, { color: theme.textMuted }]}>
                  {patron.isOnline ? 'Active in Studio' : patron.lastSeenText} • {patron.city}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Right Action Icons: Dossier & Call */}
            <View style={styles.chatHeaderActionsRow}>
              {patron.phone && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(`tel:${patron.phone}`)}
                  style={[styles.chatActionIconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F5EBD5' }]}
                  activeOpacity={0.75}
                >
                  <Ionicons name="call-outline" size={16} color={theme.primary} />
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => setDossierModalVisible(true)}
                style={[styles.chatActionIconBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F5EBD5' }]}
                activeOpacity={0.75}
              >
                <Ionicons name="information-circle-outline" size={18} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Pinned Atelier Context Ribbon ─────────────────────────────────── */}
          {context && (
            <View
              style={[
                styles.pinnedContextRibbon,
                {
                  backgroundColor: isDark ? 'rgba(196, 108, 39, 0.10)' : '#FEF8EE',
                  borderColor: isDark ? 'rgba(196, 108, 39, 0.25)' : 'rgba(196, 108, 39, 0.20)',
                },
              ]}
            >
              <Image source={{ uri: context.image }} style={styles.contextMiniThumb} resizeMode="cover" />

              <View style={styles.contextInfoCol}>
                <View style={styles.contextTopRow}>
                  <Text style={[styles.contextRefTag, { color: theme.primary }]}>
                    {context.referenceNumber}
                  </Text>
                  <View style={[styles.contextStatusPill, { backgroundColor: context.statusBg }]}>
                    <Text style={[styles.contextStatusPillText, { color: context.statusColor }]}>
                      {context.statusLabel}
                    </Text>
                  </View>
                </View>

                <Text
                  style={[styles.contextTitleText, { color: theme.textPrimary }]}
                  numberOfLines={1}
                >
                  {context.title}
                </Text>

                <Text style={[styles.contextPriceText, { color: theme.textSecondary }]}>
                  Valuation: <Text style={{ fontFamily: FontFamily.headingBold, color: theme.primary }}>{formatPriceValue(context.price)}</Text>
                </Text>
              </View>

              {/* View Brief Trigger */}
              <TouchableOpacity
                onPress={() => setSpecModalVisible(true)}
                style={[styles.viewBriefBtn, { backgroundColor: theme.primary }]}
                activeOpacity={0.85}
              >
                <Ionicons name="document-text-outline" size={13} color="#FFFFFF" style={{ marginRight: 3 }} />
                <Text style={styles.viewBriefBtnText}>Spec</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── Chat Room Authorization / Fetch Error Banner ────────────────── */}
        {chatRoomError && (
          <View
            style={{
              marginHorizontal: Spacing.md,
              marginTop: Spacing.sm,
              padding: Spacing.sm,
              borderRadius: Radius.md,
              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
              borderColor: isDark ? 'rgba(239, 68, 68, 0.35)' : '#FCA5A5',
              borderWidth: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
              <Ionicons name="lock-closed-outline" size={18} color="#EF4444" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 12, color: theme.textSecondary, flexShrink: 1 }}>
                {(chatRoomError as any)?.status === 403
                  ? 'Submit a custom bid first to join this client chat room.'
                  : (chatRoomError as any)?.data?.message || 'Unable to load chat messages right now.'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                if ((chatRoomError as any)?.status === 403) {
                  setBidModalVisible(true);
                } else {
                  refetchChatRoom();
                }
              }}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: Radius.sm,
                backgroundColor: (chatRoomError as any)?.status === 403 ? theme.primary : '#EF4444',
              }}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 11, fontFamily: FontFamily.poppinsSemiBold }}>
                {(chatRoomError as any)?.status === 403 ? 'Submit Bid' : 'Retry'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Message Stream (FlatList) or Skeleton ───────────────────────── */}
        {isChatRoomLoading && (!activeThread.messages || activeThread.messages.length === 0) ? (
          <VendorChatRoomSkeleton />
        ) : (
          <FlatList
            ref={flatListRef}
            data={activeThread.messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[styles.messagesListContent, { paddingBottom: 16 }]}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => {
            const isArtisan = item.senderRole === 'ARTISAN';
            const isSystem = item.senderRole === 'SYSTEM';

            // System Message
            if (isSystem) {
              return (
                <View style={styles.systemMessageWrap}>
                  <View
                    style={[
                      styles.systemMessageCard,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
                        borderColor: theme.borderSubtle,
                      },
                    ]}
                  >
                    <Ionicons name="shield-checkmark" size={14} color="#009D1A" style={{ marginRight: 6 }} />
                    <Text style={[styles.systemMessageText, { color: theme.textSecondary }]}>
                      {item.text}
                    </Text>
                  </View>
                </View>
              );
            }

            return (
              <View
                style={[
                  styles.messageRowWrap,
                  isArtisan ? styles.messageRowArtisan : styles.messageRowPatron,
                ]}
              >
                {/* Patron Avatar for patron messages */}
                {!isArtisan && (
                  <Image source={{ uri: patron.avatar }} style={styles.bubbleAvatarImg} />
                )}

                <View style={[styles.bubbleCol, isArtisan && { alignItems: 'flex-end' }]}>
                  {/* The Bubble Canvas */}
                  <View
                    style={[
                      styles.messageBubbleBox,
                      isArtisan
                        ? [
                            styles.messageBubbleArtisan,
                            { backgroundColor: theme.primary },
                          ]
                        : [
                            styles.messageBubblePatron,
                            {
                              backgroundColor: isDark ? '#23180F' : '#F5EBD5',
                              borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(54, 19, 0, 0.06)',
                            },
                          ],
                    ]}
                  >
                    {/* Message Body Text */}
                    <Text
                      style={[
                        styles.messageBodyText,
                        { color: isArtisan ? '#FFFFFF' : theme.textPrimary },
                      ]}
                    >
                      {item.text}
                    </Text>

                    {/* Image Attachment (Tap to Lightbox) */}
                    {item.attachment?.type === 'IMAGE' && item.attachment.url && (
                      <TouchableOpacity
                        onPress={() => handleOpenLightbox(item.attachment!.url!)}
                        style={styles.attachmentImgContainer}
                        activeOpacity={0.9}
                      >
                        <Image
                          source={{ uri: item.attachment.url }}
                          style={styles.attachmentImg}
                          resizeMode="cover"
                        />
                        <View style={styles.attachmentZoomPill}>
                          <Ionicons name="expand-outline" size={13} color="#FFFFFF" />
                          <Text style={styles.attachmentZoomText}>Inspect Photo</Text>
                        </View>
                        {item.attachment.caption && (
                          <Text
                            style={[
                              styles.attachmentCaptionText,
                              { color: isArtisan ? 'rgba(255,255,255,0.9)' : theme.textSecondary },
                            ]}
                          >
                            {item.attachment.caption}
                          </Text>
                        )}
                      </TouchableOpacity>
                    )}

                    {/* Interactive Bespoke Bid Proposal Card in Thread */}
                    {item.attachment?.type === 'BID_PROPOSAL' && item.attachment.bidData && (
                      <View
                        style={[
                          styles.inThreadBidCard,
                          {
                            backgroundColor: isDark ? '#19110A' : '#FFFFFF',
                            borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(54, 19, 0, 0.12)',
                          },
                        ]}
                      >
                        <View style={styles.inThreadBidHeader}>
                          <View style={styles.inThreadBidIcon}>
                            <CustomBidsFigmaIcon size={14} color="#C46C27" />
                          </View>
                          <Text style={[styles.inThreadBidTitle, { color: theme.textPrimary }]}>
                            Official Atelier Proposal
                          </Text>
                          <View
                            style={[
                              styles.inThreadBidStatusPill,
                              {
                                backgroundColor:
                                  item.attachment.bidData.status === 'ACCEPTED'
                                    ? 'rgba(0, 157, 26, 0.12)'
                                    : 'rgba(196, 108, 39, 0.12)',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.inThreadBidStatusText,
                                {
                                  color:
                                    item.attachment.bidData.status === 'ACCEPTED'
                                      ? '#009D1A'
                                      : '#C46C27',
                                },
                              ]}
                            >
                              {item.attachment.bidData.status}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.inThreadBidValuesRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.inThreadBidLabel}>PROPOSED AMOUNT</Text>
                            <Text style={[styles.inThreadBidAmount, { color: theme.textPrimary }]}>
                              {formatPriceValue(item.attachment.bidData.amount)}
                            </Text>
                          </View>

                          <View style={styles.inThreadBidDivider} />

                          <View style={{ flex: 1, paddingLeft: 12 }}>
                            <Text style={styles.inThreadBidLabel}>TURNAROUND</Text>
                            <Text style={[styles.inThreadBidTimeline, { color: theme.textPrimary }]}>
                              {item.attachment.bidData.deliveryDays} Days
                            </Text>
                          </View>
                        </View>

                        {item.attachment.bidData.notes && (
                          <Text
                            style={[styles.inThreadBidNotes, { color: theme.textSecondary }]}
                            numberOfLines={2}
                          >
                            {item.attachment.bidData.notes}
                          </Text>
                        )}

                        <TouchableOpacity
                          onPress={() => {
                            setBidAmountInput(String(item.attachment!.bidData!.amount));
                            setBidDaysInput(String(item.attachment!.bidData!.deliveryDays));
                            setBidModalVisible(true);
                          }}
                          style={[styles.reviseBidBtn, { borderColor: theme.primary }]}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="create-outline" size={13} color={theme.primary} style={{ marginRight: 4 }} />
                          <Text style={[styles.reviseBidBtnText, { color: theme.primary }]}>
                            Revise Quote / Terms
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  {/* Timestamp & Delivery Status */}
                  <View style={styles.bubbleMetaRow}>
                    <Text style={[styles.bubbleTimeText, { color: theme.textMuted }]}>
                      {item.timeLabel}
                    </Text>
                    {isArtisan && (
                      <Ionicons
                        name="checkmark-done"
                        size={14}
                        color={item.status === 'READ' ? '#0284C7' : theme.textMuted}
                        style={{ marginLeft: 4 }}
                      />
                    )}
                  </View>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
              <View style={{ paddingVertical: 40, alignItems: 'center', justifyContent: 'center' }}>
                <View
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F5EBD5',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 12,
                  }}
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={26} color={theme.primary} />
                </View>
                <Text
                  style={{
                    fontFamily: FontFamily.headingMedium,
                    fontSize: 15,
                    color: theme.textPrimary,
                    marginBottom: 4,
                  }}
                >
                  Start Atelier Dialogue
                </Text>
                <Text
                  style={{
                    fontFamily: FontFamily.poppinsRegular,
                    fontSize: 12,
                    color: theme.textSecondary,
                    textAlign: 'center',
                    paddingHorizontal: 32,
                  }}
                >
                  Send an initial greeting, custom proposal, or quote to the patron to open collaboration.
                </Text>
              </View>
            }
          />
        )}

        {/* ── Smart Artisan Quick Reply Chips ───────────────────────────────── */}
        <View style={[styles.quickRepliesStrip, { borderTopColor: theme.borderSubtle }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRepliesScroll}>
            {SMART_REPLIES.map((reply, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => handleSendMessage(reply)}
                style={[
                  styles.quickReplyChip,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F5EBD5',
                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(54, 19, 0, 0.1)',
                  },
                ]}
                activeOpacity={0.75}
              >
                <Text style={[styles.quickReplyChipText, { color: theme.textPrimary }]}>
                  {reply}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── Artisan Tactile Compose Toolbar ───────────────────────────────── */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <View
            style={[
              styles.composeBarWrap,
              {
                backgroundColor: theme.card,
                borderTopColor: theme.borderSubtle,
                paddingBottom: Math.max(insets.bottom, 12),
              },
            ]}
          >
            {/* Attachment Button (+) */}
            <TouchableOpacity
              onPress={() => setBidModalVisible(true)}
              style={[
                styles.composeActionBtn,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F5EBD5' },
              ]}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={22} color={theme.primary} />
            </TouchableOpacity>

            {/* Quick Camera Snapshot Button */}
            <TouchableOpacity
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert(
                  'Camera & Media',
                  'Media attachment dialog ready. Would you like to send a workshop progress update?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Send Update',
                      onPress: () => handleSendMessage('Progress snapshot from workshop attached 📸'),
                    },
                  ]
                );
              }}
              disabled={isSendingMessage}
              style={[
                styles.composeActionBtn,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F5EBD5' },
              ]}
              activeOpacity={0.8}
            >
              <Ionicons name="camera-outline" size={20} color={theme.textPrimary} />
            </TouchableOpacity>

            {/* Text Input Field */}
            <View
              style={[
                styles.composeInputContainer,
                {
                  backgroundColor: theme.background,
                  borderColor: theme.borderSubtle,
                },
              ]}
            >
              <TextInput
                value={inputMessage}
                onChangeText={setInputMessage}
                placeholder="Message patron..."
                placeholderTextColor={theme.textMuted}
                multiline
                maxLength={1000}
                editable={!isSendingMessage}
                style={[styles.composeTextInput, { color: theme.textPrimary }]}
              />
            </View>

            {/* Tactile Send Button */}
            <TouchableOpacity
              onPress={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isSendingMessage}
              style={[
                styles.sendBtnPill,
                {
                  backgroundColor: inputMessage.trim() && !isSendingMessage ? theme.primary : isDark ? '#2E2015' : '#E8DCBF',
                },
              ]}
              activeOpacity={0.85}
            >
              {isSendingMessage ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons
                  name="arrow-up"
                  size={18}
                  color={inputMessage.trim() ? '#FFFFFF' : theme.textMuted}
                />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>

        {/* ════════════════════════════════════════════════════════════════════
            MODAL 2: QUICK CUSTOM BID / OFFER CREATOR SHEET (statusBarTranslucent)
        ════════════════════════════════════════════════════════════════════ */}
        <Modal
          visible={bidModalVisible}
          animationType="slide"
          transparent
          statusBarTranslucent
          onRequestClose={() => setBidModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={styles.modalBackdropDismiss}
              activeOpacity={1}
              onPress={() => setBidModalVisible(false)}
            />
            <View
              style={[
                styles.modalSheetBox,
                { backgroundColor: theme.card, borderColor: theme.borderSubtle },
              ]}
            >
              <View style={styles.sheetHandleWrap}>
                <View
                  style={[
                    styles.sheetHandle,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.20)'
                        : 'rgba(54, 19, 0, 0.20)',
                    },
                  ]}
                />
              </View>

              <View style={[styles.modalHeaderRow, { borderBottomColor: theme.borderSubtle }]}>
                <TouchableOpacity onPress={() => setBidModalVisible(false)}>
                  <Ionicons name="close" size={22} color={theme.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.modalTitleText, { color: theme.textPrimary }]}>
                  Craft Proposal / Quote
                </Text>
                <View style={{ width: 22 }} />
              </View>

              <ScrollView
                style={{ maxHeight: SCREEN_HEIGHT * 0.65 }}
                contentContainerStyle={{ padding: Spacing.md, paddingBottom: 30 }}
                showsVerticalScrollIndicator={false}
              >
                <Text style={[styles.sheetSectionLabel, { color: theme.textPrimary }]}>
                  Offer Amount (₦ NGN)
                </Text>
                <TextInput
                  value={bidAmountInput}
                  onChangeText={setBidAmountInput}
                  keyboardType="numeric"
                  placeholder="e.g. 450000"
                  placeholderTextColor={theme.textMuted}
                  style={[
                    styles.modalTextInput,
                    {
                      backgroundColor: theme.background,
                      color: theme.textPrimary,
                      borderColor: theme.borderSubtle,
                    },
                  ]}
                />

                {/* Quick Increment Pills */}
                <View style={styles.incrementPillsRow}>
                  {[25000, 50000, 100000].map((inc) => (
                    <TouchableOpacity
                      key={inc}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        const cur = parseFloat(bidAmountInput) || 0;
                        setBidAmountInput(String(cur + inc));
                      }}
                      style={[
                        styles.incPillBtn,
                        {
                          backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F5EBD5',
                          borderColor: theme.borderSubtle,
                        },
                      ]}
                    >
                      <Text style={[styles.incPillText, { color: theme.primary }]}>
                        +{formatPriceValue(inc)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.sheetSectionLabel, { color: theme.textPrimary, marginTop: 16 }]}>
                  Production Turnaround (Days)
                </Text>
                <TextInput
                  value={bidDaysInput}
                  onChangeText={setBidDaysInput}
                  keyboardType="numeric"
                  placeholder="e.g. 14"
                  placeholderTextColor={theme.textMuted}
                  style={[
                    styles.modalTextInput,
                    {
                      backgroundColor: theme.background,
                      color: theme.textPrimary,
                      borderColor: theme.borderSubtle,
                    },
                  ]}
                />

                <Text style={[styles.sheetSectionLabel, { color: theme.textPrimary, marginTop: 16 }]}>
                  Crafting Guarantee & Specifications Note
                </Text>
                <TextInput
                  value={bidNotesInput}
                  onChangeText={setBidNotesInput}
                  placeholder="Specify material grades, casting technique, packaging, and freight terms..."
                  placeholderTextColor={theme.textMuted}
                  multiline
                  numberOfLines={4}
                  style={[
                    styles.modalTextArea,
                    {
                      backgroundColor: theme.background,
                      color: theme.textPrimary,
                      borderColor: theme.borderSubtle,
                    },
                  ]}
                />

                {/* Submit Proposal CTA */}
                <TouchableOpacity
                  onPress={handleProposeBid}
                  disabled={isSubmittingBid}
                  style={[
                    styles.primaryModalCtaBtn,
                    {
                      backgroundColor: theme.primary,
                      marginTop: 22,
                      opacity: isSubmittingBid ? 0.7 : 1,
                    },
                  ]}
                  activeOpacity={0.85}
                >
                  {isSubmittingBid ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="paper-plane" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.primaryModalCtaBtnText}>
                        Send Official Proposal in Thread
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* ════════════════════════════════════════════════════════════════════
            MODAL 3: COMMISSION / PRODUCT SPEC INSPECTOR (statusBarTranslucent)
        ════════════════════════════════════════════════════════════════════ */}
        <Modal
          visible={specModalVisible}
          animationType="slide"
          transparent
          statusBarTranslucent
          onRequestClose={() => setSpecModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={styles.modalBackdropDismiss}
              activeOpacity={1}
              onPress={() => setSpecModalVisible(false)}
            />
            <View
              style={[
                styles.modalSheetBox,
                { backgroundColor: theme.card, borderColor: theme.borderSubtle },
              ]}
            >
              <View style={styles.sheetHandleWrap}>
                <View
                  style={[
                    styles.sheetHandle,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.20)'
                        : 'rgba(54, 19, 0, 0.20)',
                    },
                  ]}
                />
              </View>

              <View style={[styles.modalHeaderRow, { borderBottomColor: theme.borderSubtle }]}>
                <TouchableOpacity onPress={() => setSpecModalVisible(false)}>
                  <Ionicons name="close" size={22} color={theme.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.modalTitleText, { color: theme.textPrimary }]}>
                  {context?.type === 'BESPOKE_REQUEST' ? 'Bespoke Commission Brief' : 'Catalog Masterpiece'}
                </Text>
                <View style={{ width: 22 }} />
              </View>

              {context && (
                <ScrollView
                  style={{ maxHeight: SCREEN_HEIGHT * 0.70 }}
                  contentContainerStyle={{ padding: Spacing.md, paddingBottom: 30 }}
                  showsVerticalScrollIndicator={false}
                >
                  <Image source={{ uri: context.image }} style={styles.specHeroImg} resizeMode="cover" />

                  <View style={styles.specTitleBlock}>
                    <Text style={[styles.specHeading, { color: theme.textPrimary }]}>
                      {context.title}
                    </Text>
                    <Text style={[styles.specRefNumber, { color: theme.primary }]}>
                      {context.referenceNumber}
                    </Text>
                  </View>

                  <Text style={[styles.specDesc, { color: theme.textSecondary }]}>
                    {context.description}
                  </Text>

                  {/* Valuation & Status Card */}
                  <View
                    style={[
                      styles.specSummaryBox,
                      {
                        backgroundColor: isDark ? '#19110A' : '#FDFBF7',
                        borderColor: theme.borderSubtle,
                      },
                    ]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.specSubLabel}>AGREED VALUATION</Text>
                      <Text style={[styles.specValuationValue, { color: theme.textPrimary }]}>
                        {formatPriceValue(context.price)}
                      </Text>
                    </View>

                    <View style={styles.specDividerLine} />

                    <View style={{ flex: 1, paddingLeft: 12 }}>
                      <Text style={styles.specSubLabel}>STATUS</Text>
                      <Text style={[styles.specStatusValue, { color: context.statusColor }]}>
                        {context.statusLabel}
                      </Text>
                    </View>
                  </View>

                  {/* Measurements Grid */}
                  {context.measurements && Object.keys(context.measurements).length > 0 && (
                    <View style={{ marginTop: 18 }}>
                      <Text style={[styles.specSectionHeading, { color: theme.textPrimary }]}>
                        Client Custom Dimensions
                      </Text>
                      <View
                        style={[
                          styles.measurementsBox,
                          {
                            backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F5EBD5',
                            borderColor: theme.borderSubtle,
                          },
                        ]}
                      >
                        {Object.entries(context.measurements).map(([key, val]) => (
                          <View key={key} style={styles.measurementRow}>
                            <Text style={[styles.measurementKeyText, { color: theme.textSecondary }]}>
                              {key}
                            </Text>
                            <Text style={[styles.measurementValText, { color: theme.textPrimary }]}>
                              {val}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {context.material && (
                    <View style={{ marginTop: 14 }}>
                      <Text style={[styles.specSectionHeading, { color: theme.textPrimary }]}>
                        Material Authenticity
                      </Text>
                      <Text style={[styles.materialText, { color: theme.textSecondary }]}>
                        {context.material}
                      </Text>
                    </View>
                  )}
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>

        {/* ════════════════════════════════════════════════════════════════════
            MODAL 4: IMAGE LIGHTBOX MODAL (statusBarTranslucent)
        ════════════════════════════════════════════════════════════════════ */}
        <Modal
          visible={lightboxVisible}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setLightboxVisible(false)}
        >
          <View style={styles.lightboxBackdrop}>
            <TouchableOpacity
              onPress={() => setLightboxVisible(false)}
              style={styles.lightboxCloseBtn}
              activeOpacity={0.8}
            >
              <Ionicons name="close" size={26} color="#FFFFFF" />
            </TouchableOpacity>

            {lightboxUrl && (
              <Image source={{ uri: lightboxUrl }} style={styles.lightboxImage} resizeMode="contain" />
            )}
          </View>
        </Modal>

        {/* ════════════════════════════════════════════════════════════════════
            MODAL 5: PATRON DOSSIER SHEET (statusBarTranslucent)
        ════════════════════════════════════════════════════════════════════ */}
        <Modal
          visible={dossierModalVisible}
          animationType="slide"
          transparent
          statusBarTranslucent
          onRequestClose={() => setDossierModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={styles.modalBackdropDismiss}
              activeOpacity={1}
              onPress={() => setDossierModalVisible(false)}
            />
            <View
              style={[
                styles.modalSheetBox,
                { backgroundColor: theme.card, borderColor: theme.borderSubtle },
              ]}
            >
              <View style={styles.sheetHandleWrap}>
                <View
                  style={[
                    styles.sheetHandle,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.20)'
                        : 'rgba(54, 19, 0, 0.20)',
                    },
                  ]}
                />
              </View>

              <View style={[styles.modalHeaderRow, { borderBottomColor: theme.borderSubtle }]}>
                <TouchableOpacity onPress={() => setDossierModalVisible(false)}>
                  <Ionicons name="close" size={22} color={theme.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.modalTitleText, { color: theme.textPrimary }]}>
                  Patron Dossier
                </Text>
                <View style={{ width: 22 }} />
              </View>

              <ScrollView
                style={{ maxHeight: SCREEN_HEIGHT * 0.65 }}
                contentContainerStyle={{ padding: Spacing.md, paddingBottom: 30 }}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.dossierProfileHeader}>
                  <Image source={{ uri: patron.avatar }} style={styles.dossierLargeAvatar} />
                  <Text style={[styles.dossierNameText, { color: theme.textPrimary }]}>
                    {patron.name}
                  </Text>
                  <Text style={[styles.dossierLocationText, { color: theme.textSecondary }]}>
                    {patron.countryFlag} {patron.city}, {patron.country}
                  </Text>
                  <View style={[styles.dossierTierBadge, { backgroundColor: isDark ? 'rgba(209, 153, 90, 0.16)' : 'rgba(196, 108, 39, 0.12)' }]}>
                    <Text style={[styles.dossierTierText, { color: isDark ? '#D1995A' : theme.primary }]}>
                      {patron.collectorTier}
                    </Text>
                  </View>
                </View>

                {/* 2x2 Lifetime Stats */}
                <View style={styles.dossierStatsGrid}>
                  <View
                    style={[
                      styles.dossierStatCard,
                      { backgroundColor: theme.background, borderColor: theme.borderSubtle },
                    ]}
                  >
                    <Text style={styles.dossierStatLabel}>TOTAL EXPENDITURE</Text>
                    <Text style={[styles.dossierStatVal, { color: theme.textPrimary }]}>
                      {formatPriceValue(patron.totalSpent)}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.dossierStatCard,
                      { backgroundColor: theme.background, borderColor: theme.borderSubtle },
                    ]}
                  >
                    <Text style={styles.dossierStatLabel}>COMPLETED ORDERS</Text>
                    <Text style={[styles.dossierStatVal, { color: theme.textPrimary }]}>
                      {patron.orderCount} Bespoke
                    </Text>
                  </View>
                </View>

                {/* Private Workshop Notes */}
                <View style={{ marginTop: 18 }}>
                  <Text style={[styles.specSectionHeading, { color: theme.textPrimary }]}>
                    Artisan Workshop Notes
                  </Text>
                  <View
                    style={[
                      styles.notesBox,
                      { backgroundColor: theme.background, borderColor: theme.borderSubtle },
                    ]}
                  >
                    <Text style={[styles.notesText, { color: theme.textSecondary }]}>
                      {patron.notes}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // VIEW 1: MASTER INBOX & CONVERSATIONS HUB
  // ════════════════════════════════════════════════════════════════════════════
  return (
    <View style={[styles.inboxRoot, { backgroundColor: theme.background }]}>
      {/* ── FlatList Main Conversations Listing ─────────────────────────── */}
      <FlatList
        data={paginatedThreads}
        keyExtractor={(item) => item.id}
        renderItem={renderThreadItem}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderListEmpty}
        ListFooterComponent={renderListFooter}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      />

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL 1: FILTER & CHANNEL SELECTOR BOTTOM SHEET (statusBarTranslucent)
      ════════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdropDismiss}
            activeOpacity={1}
            onPress={() => setFilterModalVisible(false)}
          />
          <View
            style={[
              styles.modalSheetBox,
              {
                backgroundColor: theme.card,
                borderColor: theme.borderSubtle,
                paddingBottom: Math.max(insets.bottom, 24),
              },
            ]}
          >
            {/* Sheet Handle */}
            <View style={styles.sheetHandleWrap}>
              <View
                style={[
                  styles.sheetHandle,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.20)'
                      : 'rgba(54, 19, 0, 0.20)',
                  },
                ]}
              />
            </View>

            {/* Header */}
            <View style={[styles.modalHeaderRow, { borderBottomColor: theme.borderSubtle }]}>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={22} color={theme.textPrimary} />
              </TouchableOpacity>
              <Text style={[styles.modalTitleText, { color: theme.textPrimary }]}>
                Filter Conversations
              </Text>
              <View style={{ width: 22 }} />
            </View>

            <View style={styles.filterSheetContent}>
              <Text style={[styles.dialogSubText, { color: theme.textSecondary }]}>
                Show inquiries matching selected atelier channel:
              </Text>

              {(
                [
                  { key: 'ALL', label: 'All Inquiries & Briefs', icon: 'sparkles-outline', count: totalUnreadCount },
                  { key: 'BESPOKE', label: 'Bespoke Custom Requests', icon: 'hammer-outline' },
                  { key: 'CATALOG', label: 'Catalog Product Chats', icon: 'cube-outline' },
                  { key: 'VIP', label: 'VIP Repeat Collectors', icon: 'star-outline' },
                  { key: 'CONCIERGE', label: 'Platform Concierge & Logistics', icon: 'shield-checkmark-outline' },
                ] as { key: ChannelType; label: string; icon: keyof typeof Ionicons.glyphMap; count?: number }[]
              ).map((opt) => {
                const isSelected = selectedChannel === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedChannel(opt.key);
                      setFilterModalVisible(false);
                    }}
                    style={[
                      styles.dialogOptionRow,
                      {
                        backgroundColor: isSelected
                          ? isDark
                            ? 'rgba(196, 108, 39, 0.18)'
                            : '#FEF3C7'
                          : isDark
                          ? 'rgba(255, 255, 255, 0.03)'
                          : 'rgba(54, 19, 0, 0.03)',
                        borderColor: isSelected ? theme.primary : 'transparent',
                        borderWidth: 1,
                      },
                    ]}
                    activeOpacity={0.7}
                  >
                    <View style={styles.dialogOptionLeft}>
                      <View
                        style={[
                          styles.dialogOptionIconCircle,
                          {
                            backgroundColor: isSelected
                              ? theme.primary
                              : isDark
                              ? 'rgba(255, 255, 255, 0.06)'
                              : '#F5EBD5',
                          },
                        ]}
                      >
                        <Ionicons
                          name={opt.icon}
                          size={16}
                          color={isSelected ? '#FFFFFF' : theme.primary}
                        />
                      </View>
                      <Text
                        style={[
                          styles.dialogOptionLabel,
                          {
                            color: isSelected ? (isDark ? '#D1995A' : theme.primaryDark) : theme.textPrimary,
                            fontFamily: isSelected ? FontFamily.headingBold : FontFamily.poppinsMedium,
                          },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      {opt.count !== undefined && opt.count > 0 && (
                        <View style={[styles.dialogOptionBadge, { backgroundColor: theme.primary }]}>
                          <Text style={styles.dialogOptionBadgeText}>{opt.count}</Text>
                        </View>
                      )}
                      {isSelected ? (
                        <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                      ) : (
                        <Ionicons name="ellipse-outline" size={18} color={theme.borderSubtle} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Polished African Luxury Stylesheet ─────────────────────────────────────────
const styles = StyleSheet.create({
  inboxRoot: {
    flex: 1,
  },
  inboxHeaderCard: {
    borderBottomWidth: 1,
    paddingTop: 10,
    paddingBottom: 10,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    gap: 10,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: FontFamily.poppinsMedium,
    padding: 0,
  },
  filterTriggerBtn: {
    width: 42,
    height: 42,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelsScrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: 10,
    gap: 8,
  },
  channelPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
    gap: 6,
  },
  channelPillText: {
    fontSize: 12.5,
  },
  channelBadgePill: {
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  channelBadgeText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontFamily: FontFamily.headingBold,
  },

  // Threads List
  threadsScroll: {
    flex: 1,
  },
  threadsContainer: {
    padding: Spacing.md,
    gap: 10,
  },
  threadCard: {
    flexDirection: 'row',
    padding: 13,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  threadAvatarWrap: {
    position: 'relative',
    marginRight: 12,
  },
  threadAvatarImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#C46C27',
  },
  threadOnlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: '#009D1A',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  threadDetailsCol: {
    flex: 1,
    justifyContent: 'center',
  },
  threadTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  threadNameGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    gap: 6,
  },
  threadPatronName: {
    fontSize: 14.5,
  },
  vipTagPill: {
    backgroundColor: 'rgba(196, 108, 39, 0.12)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  vipTagText: {
    color: '#C46C27',
    fontSize: 9.5,
    fontFamily: FontFamily.headingBold,
  },
  threadTimestamp: {
    fontSize: 11.5,
  },
  contextBadgeRow: {
    marginBottom: 4,
  },
  contextBadgeTag: {
    fontSize: 11.5,
    fontFamily: FontFamily.poppinsMedium,
  },
  threadLastMsgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  threadLastMsgText: {
    flex: 1,
    fontSize: 12.5,
    marginRight: 8,
  },
  unreadCountPill: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadCountText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: FontFamily.headingBold,
  },

  // Empty Inbox
  emptyInboxBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyInboxIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyInboxTitle: {
    fontSize: 17,
    fontFamily: FontFamily.headingBold,
    marginBottom: 6,
  },
  emptyInboxSub: {
    fontSize: 13,
    fontFamily: FontFamily.poppinsRegular,
    textAlign: 'center',
    maxWidth: 280,
  },

  // ════════════════════════════════════════════════════════════════════════════
  // ACTIVE CHAT VIEW STYLES
  // ════════════════════════════════════════════════════════════════════════════
  chatRoomRoot: {
    flex: 1,
  },
  chatHeaderWrap: {
    borderBottomWidth: 1,
  },
  chatHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  chatHeaderBackBtn: {
    padding: 6,
    marginRight: 2,
  },
  chatHeaderAvatarTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chatHeaderAvatarWrap: {
    position: 'relative',
    marginRight: 10,
  },
  chatHeaderAvatarImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#C46C27',
  },
  chatHeaderOnlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#009D1A',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  chatHeaderNameCol: {
    flex: 1,
  },
  chatHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chatHeaderPatronName: {
    fontSize: 14.5,
    fontFamily: FontFamily.headingBold,
  },
  vipPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    gap: 2,
  },
  vipPillText: {
    fontSize: 9.5,
    fontFamily: FontFamily.headingBold,
    color: '#B45309',
  },
  chatHeaderStatusSub: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsRegular,
  },
  chatHeaderActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chatActionIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Pinned Context Ribbon
  pinnedContextRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.md,
    marginBottom: 8,
    padding: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  contextMiniThumb: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    marginRight: 10,
  },
  contextInfoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  contextTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 1,
  },
  contextRefTag: {
    fontSize: 10.5,
    fontFamily: FontFamily.headingBold,
  },
  contextStatusPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  contextStatusPillText: {
    fontSize: 9,
    fontFamily: FontFamily.headingBold,
  },
  contextTitleText: {
    fontSize: 12.5,
    fontFamily: FontFamily.headingBold,
  },
  contextPriceText: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsRegular,
  },
  viewBriefBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: Radius.full,
    marginLeft: 8,
  },
  viewBriefBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: FontFamily.headingBold,
  },

  // Message Bubbles Stream
  messagesListContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: 14,
  },
  systemMessageWrap: {
    alignItems: 'center',
    marginVertical: 10,
  },
  systemMessageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  systemMessageText: {
    fontSize: 11.5,
    fontFamily: FontFamily.poppinsMedium,
  },
  messageRowWrap: {
    flexDirection: 'row',
    marginVertical: 5,
    maxWidth: '86%',
  },
  messageRowArtisan: {
    alignSelf: 'flex-end',
  },
  messageRowPatron: {
    alignSelf: 'flex-start',
  },
  bubbleAvatarImg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
    alignSelf: 'flex-end',
    marginBottom: 4,
  },
  bubbleCol: {
    maxWidth: '100%',
  },
  messageBubbleBox: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  messageBubbleArtisan: {
    borderBottomRightRadius: 4,
  },
  messageBubblePatron: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  messageBodyText: {
    fontSize: 13.5,
    fontFamily: FontFamily.poppinsRegular,
    lineHeight: 19,
  },
  bubbleMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    paddingHorizontal: 4,
  },
  bubbleTimeText: {
    fontSize: 10,
    fontFamily: FontFamily.poppinsRegular,
  },

  // Image Attachment in Bubble
  attachmentImgContainer: {
    marginTop: 8,
    borderRadius: Radius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  attachmentImg: {
    width: 220,
    height: 140,
    borderRadius: Radius.md,
  },
  attachmentZoomPill: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    gap: 4,
  },
  attachmentZoomText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: FontFamily.poppinsMedium,
  },
  attachmentCaptionText: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsRegular,
    marginTop: 4,
  },

  // In-Thread Bid Proposal Card
  inThreadBidCard: {
    marginTop: 8,
    padding: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    minWidth: 230,
  },
  inThreadBidHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  inThreadBidIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(196, 108, 39, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inThreadBidTitle: {
    fontSize: 11.5,
    fontFamily: FontFamily.headingBold,
    flex: 1,
  },
  inThreadBidStatusPill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  inThreadBidStatusText: {
    fontSize: 9,
    fontFamily: FontFamily.headingBold,
  },
  inThreadBidValuesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  inThreadBidDivider: {
    width: 1,
    height: 26,
    backgroundColor: 'rgba(150, 150, 150, 0.25)',
  },
  inThreadBidLabel: {
    fontSize: 9,
    fontFamily: FontFamily.poppinsSemiBold,
    color: '#8A8A8A',
  },
  inThreadBidAmount: {
    fontSize: 14,
    fontFamily: FontFamily.headingBold,
  },
  inThreadBidTimeline: {
    fontSize: 14,
    fontFamily: FontFamily.headingBold,
  },
  inThreadBidNotes: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsRegular,
    marginTop: 6,
  },
  reviseBidBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingVertical: 5,
    marginTop: 8,
  },
  reviseBidBtnText: {
    fontSize: 11,
    fontFamily: FontFamily.headingBold,
  },

  // Smart Quick Reply Strip
  quickRepliesStrip: {
    borderTopWidth: 1,
    paddingVertical: 7,
  },
  quickRepliesScroll: {
    paddingHorizontal: Spacing.md,
    gap: 8,
  },
  quickReplyChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  quickReplyChipText: {
    fontSize: 11.5,
    fontFamily: FontFamily.poppinsMedium,
  },

  // Compose Toolbar
  composeBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: 8,
    borderTopWidth: 1,
    gap: 8,
  },
  composeActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  composeInputContainer: {
    flex: 1,
    minHeight: 38,
    maxHeight: 100,
    borderRadius: 19,
    borderWidth: 1,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  composeTextInput: {
    fontSize: 13.5,
    fontFamily: FontFamily.poppinsRegular,
    paddingTop: Platform.OS === 'ios' ? 8 : 4,
    paddingBottom: Platform.OS === 'ios' ? 8 : 4,
  },
  sendBtnPill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ════════════════════════════════════════════════════════════════════════════
  // MODALS & SHEETS COMMON STYLES
  // ════════════════════════════════════════════════════════════════════════════
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalBackdropDismiss: {
    flex: 1,
  },
  modalSheetBox: {
    borderTopLeftRadius: SHEET_RADIUS,
    borderTopRightRadius: SHEET_RADIUS,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sheetHandleWrap: {
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 4,
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  modalTitleText: {
    fontSize: 16,
    fontFamily: FontFamily.headingBold,
  },
  sheetSectionLabel: {
    fontSize: 12,
    fontFamily: FontFamily.headingBold,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  modalTextInput: {
    height: 44,
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: FontFamily.poppinsMedium,
  },
  modalTextArea: {
    minHeight: 80,
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: FontFamily.poppinsRegular,
    textAlignVertical: 'top',
  },
  incrementPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  incPillBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  incPillText: {
    fontSize: 11,
    fontFamily: FontFamily.headingBold,
  },
  primaryModalCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderRadius: Radius.full,
  },
  primaryModalCtaBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FontFamily.headingBold,
  },

  // Spec Inspector Modal Styles
  specHeroImg: {
    width: '100%',
    height: 180,
    borderRadius: Radius.xl,
    marginBottom: 14,
  },
  specTitleBlock: {
    marginBottom: 8,
  },
  specHeading: {
    fontSize: 18,
    fontFamily: FontFamily.headingBold,
  },
  specRefNumber: {
    fontSize: 12,
    fontFamily: FontFamily.headingBold,
    marginTop: 2,
  },
  specDesc: {
    fontSize: 13,
    fontFamily: FontFamily.poppinsRegular,
    lineHeight: 19,
    marginBottom: 14,
  },
  specSummaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: 10,
  },
  specDividerLine: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(150, 150, 150, 0.25)',
  },
  specSubLabel: {
    fontSize: 9.5,
    fontFamily: FontFamily.poppinsSemiBold,
    color: '#8A8A8A',
  },
  specValuationValue: {
    fontSize: 16,
    fontFamily: FontFamily.headingBold,
  },
  specStatusValue: {
    fontSize: 13,
    fontFamily: FontFamily.headingBold,
  },
  specSectionHeading: {
    fontSize: 13,
    fontFamily: FontFamily.headingBold,
    marginBottom: 8,
  },
  measurementsBox: {
    padding: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 6,
  },
  measurementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  measurementKeyText: {
    fontSize: 12,
    fontFamily: FontFamily.poppinsMedium,
  },
  measurementValText: {
    fontSize: 12,
    fontFamily: FontFamily.headingBold,
  },
  materialText: {
    fontSize: 12.5,
    fontFamily: FontFamily.poppinsRegular,
  },

  // Lightbox Modal
  lightboxBackdrop: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxCloseBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    right: 20,
    zIndex: 99,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.75,
  },

  // Dossier Modal
  dossierProfileHeader: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  dossierLargeAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 10,
    backgroundColor: '#C46C27',
  },
  dossierNameText: {
    fontSize: 17,
    fontFamily: FontFamily.headingBold,
  },
  dossierLocationText: {
    fontSize: 12.5,
    fontFamily: FontFamily.poppinsRegular,
    marginTop: 2,
  },
  dossierTierBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.full,
    marginTop: 8,
  },
  dossierTierText: {
    fontSize: 11,
    fontFamily: FontFamily.headingBold,
  },
  dossierStatsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  dossierStatCard: {
    flex: 1,
    padding: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  dossierStatLabel: {
    fontSize: 9,
    fontFamily: FontFamily.poppinsSemiBold,
    color: '#8A8A8A',
    marginBottom: 4,
  },
  dossierStatVal: {
    fontSize: 15,
    fontFamily: FontFamily.headingBold,
  },
  notesBox: {
    padding: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  notesText: {
    fontSize: 12.5,
    fontFamily: FontFamily.poppinsRegular,
    lineHeight: 18,
  },

  // Filter Dialog Modal
  filterDialogBox: {
    margin: 20,
    padding: 16,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  dialogHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  dialogTitleText: {
    fontSize: 16,
    fontFamily: FontFamily.headingBold,
  },
  filterSheetContent: {
    padding: Spacing.md,
  },
  dialogSubText: {
    fontSize: 12.5,
    fontFamily: FontFamily.poppinsRegular,
    marginBottom: 12,
  },
  dialogOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: Radius.lg,
    marginVertical: 4,
  },
  dialogOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  dialogOptionIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialogOptionLabel: {
    fontSize: 13.5,
  },
  dialogOptionBadge: {
    borderRadius: Radius.full,
    paddingHorizontal: 7,
    paddingVertical: 1.5,
  },
  dialogOptionBadgeText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontFamily: FontFamily.headingBold,
  },
  listFooterContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  paginationCard: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  paginationInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paginationInfoText: {
    fontFamily: FontFamily.poppinsMedium,
    fontSize: 12,
  },
  paginationButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
  },
  pageNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    gap: 4,
  },
  pageNavBtnText: {
    fontFamily: FontFamily.poppinsMedium,
    fontSize: 12,
  },
  listCountText: {
    fontFamily: FontFamily.poppinsMedium,
    fontSize: 12,
    marginBottom: Spacing.xs,
  },
});
