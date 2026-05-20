import React, { useState, useEffect, useMemo, ReactNode, useRef, useCallback } from 'react';
import { 
  X,
  ChevronDown,
  Camera, 
  Search, 
  MoreVertical, 
  MessageSquare, 
  Phone, 
  UserCircle2, 
  CircleDashed,
  Users,
  Video,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Info,
  Eye,
  Plus, 
  Pencil, 
  Mic, 
  Send,
  ArrowLeft,
  Image as ImageIcon,
  Check,
  CheckCheck,
  Clock,
  Moon,
  Sun,
  UserPlus,
  Smile,
  Keyboard,
  Paperclip,
  Trash2,
  Forward,
  Heart,
  ThumbsUp,
  QrCode,
  Bell,
  Shield,
  Lock,
  Ban,
  Flag,
  Share2,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, isAfter, addHours, isToday, isYesterday, isSameDay } from 'date-fns';
import EmojiPicker, { Theme as EmojiTheme, EmojiClickData } from 'emoji-picker-react';
import { cn } from './lib/utils';
import { 
  Contact, 
  Chat, 
  Message, 
  Status, 
  MessageType, 
  StatusType 
} from './types';

// Initial Mock Data
const INITIAL_CONTACTS: Contact[] = [
  { id: '1', name: 'Mãe ❤️', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mom', status: 'Ocupada no momento.', phone: '+55 11 98888-7777' },
  { id: '2', name: 'João (Trabalho)', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John', status: 'Em reunião.', phone: '+55 11 97777-6666' },
  { id: '3', name: 'Amor 💕', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Love', status: 'Dormindo 😴', phone: '+55 11 96666-5555' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'conversas' | 'status' | 'comunidades' | 'chamadas'>('conversas');
  const [notification, setNotification] = useState<{ contact: Contact, message: string } | null>(null);
  const notificationSoundRef = useRef<HTMLAudioElement | null>(null);
  const [contacts, setContacts] = useState<Contact[]>(() => {
    try {
      const saved = localStorage.getItem('zapfake_data');
      if (saved) {
        const data = JSON.parse(saved);
        return data.contacts || INITIAL_CONTACTS;
      }
    } catch (e) {
      console.error("Failed to parse contacts from localStorage", e);
    }
    return INITIAL_CONTACTS;
  });
  const [chats, setChats] = useState<Chat[]>(() => {
    try {
      const saved = localStorage.getItem('zapfake_data');
      if (saved) {
        const data = JSON.parse(saved);
        return data.chats || [];
      }
    } catch (e) {
      console.error("Failed to parse chats from localStorage", e);
    }
    return [
      { id: 'chat1', contactId: '1', lastMessage: { id: 'm1', chatId: 'chat1', senderId: '1', type: MessageType.TEXT, content: 'Oi filho, tudo bem? Me liga quando puder.', timestamp: Date.now() - 1000 * 60 * 60, isRead: true } },
      { id: 'chat2', contactId: '3', lastMessage: { id: 'm2', chatId: 'chat2', senderId: '3', type: MessageType.TEXT, content: 'Te amo! ❤️', timestamp: Date.now() - 1000 * 60 * 5, isRead: false } }
    ];
  });
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('zapfake_data');
      if (saved) {
        const data = JSON.parse(saved);
        return data.messages || [];
      }
    } catch (e) {
      console.error("Failed to parse messages from localStorage", e);
    }
    return [
      { id: 'sys1', chatId: 'chat1', senderId: 'system', type: MessageType.SYSTEM, content: 'As mensagens e chamadas são protegidas com criptografia de ponta a ponta e ficam fora do WhatsApp. Ninguém fora desta conversa, nem mesmo o WhatsApp, pode ler ou ouvi-las. Toque para saber mais.', timestamp: Date.now() - 1000 * 60 * 120, isRead: true },
      { id: 'm1', chatId: 'chat1', senderId: '1', type: MessageType.TEXT, content: 'Oi filho, tudo bem? Me liga quando puder.', timestamp: Date.now() - 1000 * 60 * 60, isRead: true },
      { id: 'sys2', chatId: 'chat2', senderId: 'system', type: MessageType.SYSTEM, content: 'As mensagens e chamadas são protegidas com criptografia de ponta a ponta.', timestamp: Date.now() - 1000 * 60 * 10, isRead: true },
      { id: 'm2', chatId: 'chat2', senderId: '3', type: MessageType.TEXT, content: 'Te amo! ❤️', timestamp: Date.now() - 1000 * 60 * 5, isRead: false }
    ];
  });
  const [statuses, setStatuses] = useState<Status[]>(() => {
    try {
      const saved = localStorage.getItem('zapfake_data');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.statuses) {
          const now = Date.now();
          return data.statuses.filter((s: Status) => s.expiresAt > now);
        }
      }
    } catch (e) {
      console.error("Failed to parse statuses from localStorage", e);
    }
    return [
      {
        id: 's-init-1',
        creatorId: 'me',
        type: StatusType.TEXT,
        content: 'Bem-vindo ao novo layout do WhatsApp! 🚀',
        backgroundColor: '#25d366',
        timestamp: Date.now() - 1000 * 60 * 45,
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
        viewers: ['1', '2', '3']
      }
    ];
  });
  const [viewingStatus, setViewingStatus] = useState<Status[] | null>(null);
  const [currentStatusIndex, setCurrentStatusIndex] = useState(0);
  const [creatingStatus, setCreatingStatus] = useState<StatusType | null>(null);
  const [statusText, setStatusText] = useState('');
  const [imageStatusUrl, setImageStatusUrl] = useState('');
  const [videoStatusUrl, setVideoStatusUrl] = useState('');
  const [statusBg, setStatusBg] = useState('#25D366');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [isStatusViewsOpen, setIsStatusViewsOpen] = useState(false);
  const [statusReplyText, setStatusReplyText] = useState('');
  const [contactOptionsMenu, setContactOptionsMenu] = useState<{ contactId: string, x: number, y: number } | null>(null);
  const [myProfile, setMyProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('zapfake_data');
      if (saved) {
        const data = JSON.parse(saved);
        return data.myProfile || { name: 'Me', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Me' };
      }
    } catch (e) {
      console.error("Failed to parse profile from localStorage", e);
    }
    return { name: 'Me', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Me' };
  });
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'groups'>('all');
  const [isSearching, setIsSearching] = useState(false);
  const [isContactSelectorOpen, setIsContactSelectorOpen] = useState(false);
  const [previewContact, setPreviewContact] = useState<Contact | null>(null);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('wa_theme') as 'light' | 'dark') || 'light';
  });
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app is already running in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone) {
      setShowInstallBanner(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    try {
      // Show the install prompt
      if (typeof deferredPrompt.prompt === 'function') {
        await deferredPrompt.prompt();
      }
      // Wait for the user to respond to the prompt
      if (deferredPrompt.userChoice) {
        const choiceResult = await deferredPrompt.userChoice.catch(() => ({ outcome: 'dismissed' }));
        console.log(`[PWA] User response to the install prompt: ${choiceResult?.outcome}`);
      }
    } catch (err) {
      console.error("[PWA] Error triggering install event:", err);
    } finally {
      // We've used the prompt, and can't use it again, discard it
      setDeferredPrompt(null);
      setShowInstallBanner(false);
    }
  };

  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [editingStatusItem, setEditingStatusItem] = useState<Status | null>(null);
  const [isVideoPaused, setIsVideoPaused] = useState(false);
  const [videoDuration, setVideoDuration] = useState(5);
  const [forwardingMessage, setForwardingMessage] = useState<Message | null>(null);
  const [messageContextMenu, setMessageContextMenu] = useState<{ messageId: string, x: number, y: number, isMe: boolean } | null>(null);
  const [isEditingContactInfo, setIsEditingContactInfo] = useState(false);
  const [isContactInfoMenuOpen, setIsContactInfoMenuOpen] = useState(false);
  const [isCalling, setIsCalling] = useState<{ contact: Contact, type: 'voice' | 'video' } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Persistence
  useEffect(() => {
    localStorage.setItem('wa_theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Persistence is now handled in initializers for reading
  // and in the below useEffect for saving.
  useEffect(() => {
    const data = { contacts, chats, messages, statuses, myProfile };
    localStorage.setItem('zapfake_data', JSON.stringify(data));
  }, [contacts, chats, messages, statuses, myProfile]);

  // Actions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/mp4' });
        const url = URL.createObjectURL(blob);
        setVideoStatusUrl(url);
        setIsRecording(false);
        setRecordingTime(0);
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Não foi possível acessar a câmera para gravar o vídeo.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const handleAddMediaStatus = (type: StatusType, fileUrl: string) => {
    const newStatus: Status = {
      id: Math.random().toString(36).substring(2, 11),
      creatorId: 'me',
      type,
      content: fileUrl,
      timestamp: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      viewers: []
    };
    setStatuses([newStatus, ...statuses]);
  };

  const handleUpdateContact = (id: string, updates: Partial<Contact>) => {
    setContacts(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    if (editingContact?.id === id) {
      setEditingContact(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const handleDeleteContact = (id: string) => {
    if (!confirm('Deseja realmente excluir este contato e todas as conversas relacionadas?')) return;
    
    const chatsToDelete = chats.filter(c => c.contactId === id);
    const chatIdsToDelete = chatsToDelete.map(c => c.id);

    setContacts(prev => prev.filter(c => c.id !== id));
    setChats(prev => prev.filter(c => c.contactId !== id));
    setMessages(prev => prev.filter(m => !chatIdsToDelete.includes(m.chatId)));
    
    setContactOptionsMenu(null);
    setEditingContact(null);
    if (activeChatId && chatIdsToDelete.includes(activeChatId)) {
      setActiveChatId(null);
    }
  };

  const handleUpdateMyProfile = (updates: Partial<typeof myProfile>) => {
    setMyProfile(prev => ({ ...prev, ...updates }));
    setIsSettingsOpen(false);
  };

  const handleAddContact = () => {
    const id = Math.random().toString(36).substring(2, 11);
    const newContact: Contact = {
      id,
      name: 'Novo Contato',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`,
      status: 'Olá! Eu estou usando o WhatsApp.'
    };
    setContacts([...contacts, newContact]);
    setEditingContact(newContact);
  };

  const handleAddChat = (contactId: string) => {
    const id = Math.random().toString(36).substring(2, 11);
    const systemMsg: Message = {
      id: `sys-${id}`,
      chatId: id,
      senderId: 'system',
      type: MessageType.SYSTEM,
      content: 'As mensagens e chamadas são protegidas com criptografia de ponta a ponta e ficam fora do WhatsApp. Toque para saber mais.',
      timestamp: Date.now(),
      isRead: true
    };
    setMessages(prev => [systemMsg, ...prev]);
    setChats([{ id, contactId }, ...chats]);
    setActiveChatId(id);
    setActiveTab('conversas');
  };

  const [isAISmartReplyEnabled, setIsAISmartReplyEnabled] = useState(true);
  const [typingChats, setTypingChats] = useState<Record<string, boolean>>({});

  // Derived
  const myStatuses = useMemo(() => statuses.filter(s => s.creatorId === 'me'), [statuses]);
  const contactStatusesGrouped = useMemo(() => {
    const others = statuses.filter(s => s.creatorId !== 'me');
    const grouped: Record<string, Status[]> = {};
    others.forEach(s => {
      if (!grouped[s.creatorId]) grouped[s.creatorId] = [];
      grouped[s.creatorId].push(s);
    });
    return grouped;
  }, [statuses]);

  // Notification Permission
  useEffect(() => {
    if ("Notification" in window) {
      if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
      }
    }
  }, []);

  const showNotification = (title: string, body: string, icon?: string) => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(title, {
          body,
          icon: icon || "https://api.dicebear.com/7.x/avataaars/svg?seed=WhatsApp",
        });
      } catch (e) {
        console.error("Failed to show notification", e);
      }
    }
  };

  const triggerNotification = (contact: Contact, message: string) => {
    // Only show if not already in the chat or if we want to force notification feel
    setNotification({ contact, message });
    if (notificationSoundRef.current) {
      notificationSoundRef.current.currentTime = 0;
      notificationSoundRef.current.play().catch(e => console.log("Sound play prevented", e));
    }
  };

  const handleAIRespond = async (chatId: string, userMessage: string, type: MessageType) => {
    if (!chatId) return;
    const currentChat = chats.find(c => c.id === chatId);
    if (!currentChat) return;
    
    const contact = contacts.find(c => c.id === currentChat.contactId);
    if (!contact) return;

    const chatMessages = messages.filter(m => m.chatId === chatId).slice(-5);
    const context = chatMessages.map(m => `${m.senderId === 'me' ? 'Eu' : contact.name}: ${m.type === MessageType.TEXT ? m.content : '[' + m.type + ']'}`);

    try {
      setTypingChats(prev => ({ ...prev, [chatId]: true }));
      const displayMessage = type === MessageType.TEXT ? userMessage : `[${type}]`;
      const response = await fetch('/api/ai/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactName: contact.name,
          lastMessage: displayMessage,
          context
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'API failed');
      }
      const data = await response.json();
      
      triggerNotification(contact, data.response);
      showNotification(contact.name, data.response, contact.avatar);

      const newMessage: Message = {
        id: Math.random().toString(36).substring(2, 11),
        chatId,
        senderId: contact.id,
        type: MessageType.TEXT,
        content: data.response,
        timestamp: Date.now(),
        isRead: false
      };
      
      setMessages(prev => [...prev, newMessage]);
      setChats(prev => prev.map(c => c.id === chatId ? { ...c, lastMessage: newMessage } : c));
    } catch (err: any) {
      console.error("AI Response error:", err);
      // Optional: Add a system message or error indicator in the UI
      const errorMessage: Message = {
        id: Math.random().toString(36).substring(2, 11),
        chatId,
        senderId: 'system',
        type: MessageType.TEXT,
        content: `Erro ao obter resposta da IA: ${err.message || 'Erro de conexão'}. Verifique se a chave de API está configurada.`,
        timestamp: Date.now(),
        isRead: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setTypingChats(prev => ({ ...prev, [chatId]: false }));
    }

  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          callback(reader.result);
        }
      };
      reader.onerror = (err) => {
        console.error("FileReader error:", err);
      };
      reader.readAsDataURL(file);
    }
  };

  // Actions
  const handleAddStatus = () => {
    if (creatingStatus === StatusType.TEXT && !statusText) return;
    if (creatingStatus === StatusType.IMAGE && !imageStatusUrl) return;
    if (creatingStatus === StatusType.VIDEO && !videoStatusUrl) return;
    
    const newStatus: Status = {
      id: Math.random().toString(36).substring(2, 11),
      creatorId: 'me',
      type: creatingStatus || StatusType.TEXT,
      content: creatingStatus === StatusType.TEXT 
        ? statusText 
        : creatingStatus === StatusType.IMAGE 
          ? imageStatusUrl 
          : videoStatusUrl,
      backgroundColor: creatingStatus === StatusType.TEXT ? statusBg : undefined,
      timestamp: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      viewers: []
    };

    setStatuses([newStatus, ...statuses]);
    setCreatingStatus(null);
    setStatusText('');
    setImageStatusUrl('');
    setVideoStatusUrl('');
  };

  const handleDeleteStatus = (id: string) => {
    if (!confirm('Deseja realmente excluir este status?')) return;
    
    setStatuses(prev => prev.filter(s => s.id !== id));
    
    if (viewingStatus) {
      const filteredViewing = viewingStatus.filter(s => s.id !== id);
      if (filteredViewing.length === 0) {
        setViewingStatus(null);
        setIsVideoPaused(false);
      } else {
        setViewingStatus(filteredViewing);
        if (currentStatusIndex >= filteredViewing.length) {
          setCurrentStatusIndex(Math.max(0, filteredViewing.length - 1));
        }
        setIsVideoPaused(false);
      }
    }
    setIsStatusMenuOpen(false);
  };

  const handleStatusReply = () => {
    if (!statusReplyText.trim() || !viewingStatus) return;
    
    const currentStatus = viewingStatus[currentStatusIndex];
    if (currentStatus.creatorId === 'me') return;

    let chat = chats.find(c => c.contactId === currentStatus.creatorId);
    if (!chat) return; // Simple bail for this demo turn

    const newMessage: Message = {
      id: Math.random().toString(36).substring(2, 11),
      chatId: chat.id,
      senderId: 'me',
      type: MessageType.TEXT,
      content: `Responder status: ${statusReplyText}`,
      timestamp: Date.now(),
      isRead: true
    };

    setMessages(prev => [...prev, newMessage]);
    setChats(prev => prev.map(c => c.id === chat!.id ? { ...c, lastMessage: newMessage } : c));
    setStatusReplyText('');
    setViewingStatus(null);
  };

  const handleReact = (messageId: string, emoji: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id === messageId) {
        const reactions = m.reactions || [];
        // Se já reagiu com esse emoji, removemos. Caso contrário, adicionamos.
        // Simulando que 'me' reagiu.
        if (reactions.includes(emoji)) {
          return { ...m, reactions: reactions.filter(r => r !== emoji) };
        }
        return { ...m, reactions: [...reactions, emoji] };
      }
      return m;
    }));
    setMessageContextMenu(null);
  };

  const handleForward = (destinationChatId: string) => {
    if (!forwardingMessage) return;

    const newMessage: Message = {
      ...forwardingMessage,
      id: Math.random().toString(36).substring(2, 11),
      chatId: destinationChatId,
      senderId: 'me',
      timestamp: Date.now(),
      isRead: true,
      reactions: [],
      isForwarded: true
    };

    setMessages(prev => [...prev, newMessage]);
    setChats(prev => prev.map(c => c.id === destinationChatId ? { ...c, lastMessage: newMessage } : c));
    setForwardingMessage(null);
    setActiveChatId(destinationChatId);
  };

  return (
    <div className={cn(
      "flex flex-col h-screen bg-wa-bg text-wa-text font-sans overflow-hidden transition-colors duration-300",
      theme === 'dark' && "dark"
    )}>
      {!activeChatId ? (
        <>
          {/* Header */}
          <div className="bg-wa-header pt-4 pb-2 flex flex-col gap-4 sticky top-0 z-20">
            <div className="flex justify-between items-center px-4 transition-all duration-300">
              {isSearching ? (
                <div className="flex-1 flex items-center bg-wa-border rounded-full px-4 py-2 shadow-sm animate-in fade-in slide-in-from-left-2 transition-colors">
                  <ArrowLeft 
                    size={20} 
                    className="text-wa-text-secondary cursor-pointer mr-3" 
                    onClick={() => {
                      setIsSearching(false);
                      setSearchTerm('');
                    }} 
                  />
                  <input 
                    autoFocus
                    type="text"
                    placeholder="Pesquisar..."
                    className="flex-1 bg-transparent border-none outline-none text-[15px] text-wa-text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              ) : (
                <>
                  <h1 className="text-[23px] font-bold text-[#25d366] tracking-tight">WhatsApp</h1>
                  <div className="flex gap-4 text-wa-text-secondary items-center">
                    <Camera size={24} className="cursor-pointer hover:bg-black/5 p-1 rounded-full w-9 h-9" />
                    <Search 
                      size={24} 
                      className="cursor-pointer hover:bg-black/5 p-1 rounded-full w-9 h-9" 
                      onClick={() => setIsSearching(true)}
                    />
                    <div className="relative">
                      <button 
                        onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)} 
                        className="hover:bg-black/5 flex items-center justify-center p-1 rounded-full w-9 h-9 active:bg-black/10"
                      >
                        <MoreVertical size={24} className="cursor-pointer" />
                      </button>
                      
                      <AnimatePresence>
                        {isMoreMenuOpen && (
                          <>
                            <div 
                              className="fixed inset-0 z-40" 
                              onClick={() => setIsMoreMenuOpen(false)} 
                            />
                            <motion.div 
                              initial={{ opacity: 0, scale: 0.95, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -10 }}
                              className="absolute right-0 mt-2 w-48 bg-wa-header rounded-lg shadow-xl shadow-black/20 py-2 z-50 border border-wa-border-light overflow-hidden"
                            >
                              <button 
                                onClick={() => { setIsMoreMenuOpen(false); setIsSettingsOpen(true); }}
                                className="w-full text-left px-4 py-3 text-[15px] hover:bg-wa-bg transition-colors flex items-center gap-3"
                              >
                                <UserCircle2 size={18} /> Perfil
                              </button>
                              <button 
                                onClick={() => {
                                  setIsMoreMenuOpen(false);
                                  setTheme(theme === 'light' ? 'dark' : 'light');
                                }}
                                className="w-full text-left px-4 py-3 text-[15px] hover:bg-wa-bg transition-colors flex items-center gap-3"
                              >
                                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
                                Tema {theme === 'light' ? 'Escuro' : 'Claro'}
                              </button>
                              <button 
                                onClick={() => { setIsMoreMenuOpen(false); setIsContactSelectorOpen(true); }}
                                className="w-full text-left px-4 py-3 text-[15px] hover:bg-wa-bg transition-colors flex items-center gap-3"
                              >
                                <UserPlus size={18} /> Novo Contato
                              </button>
                              {deferredPrompt && (
                                <button 
                                  onClick={() => { setIsMoreMenuOpen(false); handleInstallClick(); }}
                                  className="w-full text-left px-4 py-3 text-[15px] hover:bg-wa-bg text-wa-green font-semibold transition-colors flex items-center gap-3 border-t border-wa-border"
                                >
                                  <Download size={18} /> Instalar Aplicativo
                                </button>
                              )}
                            </motion.div>
                          </>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Banner PWA de Instalação */}
          <AnimatePresence>
            {showInstallBanner && deferredPrompt && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-[#d9fdd3] dark:bg-[#005c4b] text-[#0b141a] dark:text-white px-4 py-3 flex items-center justify-between border-b border-wa-green/35 shadow-md sticky top-[60px] z-20"
              >
                <div className="flex items-center gap-3">
                  <div className="bg-[#25d366]/20 p-2 rounded-full">
                    <Download size={18} className="text-[#00a884] dark:text-wa-green" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold">Instalar ZapFake</p>
                    <p className="text-xs opacity-80">Baixe o app na sua tela de início para acesso offline rápido!</p>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={handleInstallClick}
                    className="bg-[#25d366] hover:bg-[#20ba5a] text-[#0b141a] px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm active:scale-95"
                  >
                    Instalar
                  </button>
                  <button
                    onClick={() => setShowInstallBanner(false)}
                    className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full"
                  >
                    <X size={16} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Content */}
          <div className="flex-1 overflow-y-auto bg-wa-bg">
            {activeTab === 'conversas' && (
              <div className="flex flex-col">
                {/* Search Bar / Filter Chips */}
                {!isSearching && (
                  <div className="px-4 pt-2 pb-4 flex flex-col gap-3 sticky top-[60px] bg-wa-header z-10 shadow-sm border-b border-wa-border">
                    <div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1">
                       {['all', 'unread', 'groups'].map((f) => (
                         <button
                           key={f}
                           onClick={() => setActiveFilter(f as any)}
                           className={cn(
                             "px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap border",
                             activeFilter === f 
                               ? "bg-wa-active-tab text-wa-green border-transparent" 
                               : "bg-wa-bg text-wa-text-muted border-wa-border-light hover:bg-wa-active-tab/50"
                           )}
                         >
                           {f === 'all' ? 'Tudo' : f === 'unread' ? 'Não lidas' : 'Grupos'}
                         </button>
                       ))}
                    </div>
                  </div>
                )}

                {/* Active Chats Section */}
                {chats.length > 0 && (
                  <div className="flex flex-col">
                    <div className="px-4 py-3 text-wa-text-muted text-[11px] font-bold uppercase tracking-wider flex items-center gap-2">
                      <Clock size={12} /> Conversas Recentes
                    </div>
                    {chats
                      .filter(chat => {
                        const contact = contacts.find(c => c.id === chat.contactId);
                        const matchesSearch = contact?.name.toLowerCase().includes(searchTerm.toLowerCase());
                        const matchesFilter = activeFilter === 'all' || (activeFilter === 'unread' && !chat.lastMessage?.isRead);
                        return matchesSearch && matchesFilter;
                      })
                      .map(chat => {
                        const contact = contacts.find(c => c.id === chat.contactId);
                        return (
                          <div 
                            key={chat.id} 
                            className="flex p-4 gap-4 px-4 hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10 cursor-pointer transition-colors group select-none relative"
                            onClick={() => setActiveChatId(chat.id)}
                            onContextMenu={(e) => {
                              if (contact) {
                                e.preventDefault();
                                setContactOptionsMenu({ contactId: contact.id, x: e.clientX, y: e.clientY });
                              }
                            }}
                          >
                            <div 
                              className="relative shrink-0"
                              onClick={(e) => { e.stopPropagation(); setPreviewContact(contact || null); }}
                            >
                              <img src={contact?.avatar} alt="" className="w-13 h-13 rounded-full border border-black/5 object-cover shadow-sm transition-transform group-active:scale-95" />
                              {/* Status Ring if active status - skipping for simplicity but adding a small indicator */}
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center border-b border-wa-border dark:border-white/5 pb-4">
                              <div className="flex justify-between items-center mb-0.5">
                                <span className={cn(
                                  "text-[17px] truncate transition-colors",
                                  chat.lastMessage?.isRead ? "font-normal text-wa-text" : "font-bold text-wa-text"
                                )}>{contact?.name}</span>
                                <span className={cn(
                                  "text-[12px] transition-colors",
                                  chat.lastMessage?.isRead ? "text-wa-text-muted" : "text-[#25d366] font-bold"
                                )}>
                                  {chat.lastMessage ? format(chat.lastMessage.timestamp, 'HH:mm') : '12:30'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center gap-2">
                                <div className={cn(
                                  "text-[14px] truncate flex-1 transition-colors flex items-center gap-1",
                                  chat.lastMessage?.isRead ? "text-wa-text-muted" : "text-wa-text font-normal"
                                )}>
                                  {chat.lastMessage?.senderId === 'me' && (
                                     <CheckCheck size={16} className={cn("shrink-0", chat.lastMessage.isRead ? "text-[#53bdeb]" : "text-wa-text-muted/60")} />
                                  )}
                                  <span className="truncate">
                                    {chat.lastMessage 
                                      ? (chat.lastMessage.type === MessageType.AUDIO ? '🎤 Áudio' : chat.lastMessage.type === MessageType.IMAGE ? '📷 Foto' : chat.lastMessage.content)
                                      : (contact?.status || "Olá! Eu estou usando o WhatsApp.")
                                    }
                                  </span>
                                </div>
                                {!chat.lastMessage?.isRead && (
                                  <div className="bg-[#25d366] text-[#0b141a] text-[11px] min-w-[20px] h-[20px] rounded-full flex items-center justify-center font-bold px-1.5 shadow-sm transform">
                                    1
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    }
                  </div>
                )}

                {/* Context Menu for Contatos */}
                <AnimatePresence>
                  {contactOptionsMenu && (
                    <>
                      <div 
                        className="fixed inset-0 z-[60]" 
                        onClick={() => setContactOptionsMenu(null)}
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        style={{ 
                          top: Math.min(contactOptionsMenu.y, typeof window !== 'undefined' ? window.innerHeight - 150 : 0), 
                          left: Math.min(contactOptionsMenu.x, typeof window !== 'undefined' ? window.innerWidth - 200 : 0) 
                        }}
                        className="fixed z-[70] bg-white dark:bg-wa-received shadow-xl rounded-lg py-2 border dark:border-wa-border-light min-w-[200px]"
                      >
                        <div className="px-4 py-2 text-[11px] font-bold text-wa-green uppercase tracking-widest border-b dark:border-wa-border-light mb-1">
                          Opções do Contato
                        </div>
                        <button 
                          className="w-full text-left px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-3 text-wa-text text-[15px] transition-colors"
                          onClick={() => {
                            const contact = contacts.find(c => c.id === contactOptionsMenu.contactId);
                            if (contact) setEditingContact(contact);
                            setContactOptionsMenu(null);
                          }}
                        >
                          <Info size={18} className="text-wa-text-muted" />
                          <span>Dados do contato</span>
                        </button>
                        <button 
                          className="w-full text-left px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 flex items-center gap-3 text-wa-text text-[15px] transition-colors"
                          onClick={() => setContactOptionsMenu(null)}
                        >
                          <MessageSquare size={18} className="text-wa-text-muted" />
                          <span>Enviar mensagem</span>
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>

                {/* Contacts Section */}
                <div className="flex flex-col mb-20 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <div className="px-4 py-3 text-wa-green text-[11px] font-bold uppercase tracking-wider bg-wa-bg/30 border-y border-wa-border-light flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <UserCircle2 size={12} /> Seus Contatos
                    </div>
                    <span className="bg-wa-green/10 text-wa-green px-1.5 py-0.5 rounded text-[9px]">{contacts.length}</span>
                  </div>

                  {contacts
                    .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map(contact => {
                      const hasActiveChat = chats.some(chat => chat.contactId === contact.id);
                      if (hasActiveChat && !searchTerm) return null; // Omit if already in active chats and not searching

                      return (
                        <div 
                          key={contact.id} 
                          className="flex items-center p-4 gap-4 hover:bg-wa-bg cursor-pointer border-b border-wa-border-light last:border-0 transition-all active:scale-[0.98] select-none"
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setContactOptionsMenu({ contactId: contact.id, x: e.clientX, y: e.clientY });
                          }}
                          onClick={() => {
                            const existingChat = chats.find(c => c.contactId === contact.id);
                            if (existingChat) {
                              setActiveChatId(existingChat.id);
                            } else {
                              handleAddChat(contact.id);
                            }
                          }}
                        >
                          <div 
                            className="relative group"
                            onClick={(e) => { e.stopPropagation(); setPreviewContact(contact || null); }}
                          >
                            <img src={contact.avatar} alt="" className="w-12 h-12 rounded-full border border-wa-border-light object-cover shadow-sm" />
                            <div className="absolute inset-0 bg-black/0 rounded-full group-active:bg-black/10 transition-colors" />
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <div className="text-[16px] font-medium text-wa-text truncate">{contact.name}</div>
                            <div className="text-sm text-wa-text-muted truncate">
                              {contact.status || 'Olá! Eu estou usando o WhatsApp.'}
                            </div>
                          </div>
                          <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MessageSquare size={18} className="text-wa-green" />
                          </div>
                        </div>
                      );
                    }
                  )}
                  
                  {contacts.length === 0 && (
                     <div className="p-10 text-center text-wa-text-muted italic text-sm">
                        Nenhum contato encontrado.
                     </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'status' && (
              <div className="flex flex-col">
                {/* My Status */}
                <div 
                  className="flex items-center p-4 gap-4 cursor-pointer hover:bg-wa-bg group"
                  onClick={() => {
                    if (myStatuses.length > 0) {
                      setViewingStatus(myStatuses);
                      setCurrentStatusIndex(0);
                    } else {
                      setCreatingStatus(StatusType.TEXT);
                    }
                  }}
                >
                  <div className="relative">
                    {myStatuses.length > 0 ? (
                      <div className="w-12 h-12 rounded-full border-2 border-wa-green p-0.5">
                         <div className="w-full h-full rounded-full overflow-hidden">
                            <img src={myProfile.avatar} alt="Me" />
                         </div>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-wa-border-light border border-wa-border">
                           <img src={myProfile.avatar} alt="Me" />
                        </div>
                        <div className="absolute bottom-0 right-0 bg-wa-green rounded-full p-0.5 border-2 border-white shadow-sm">
                          <Plus size={14} className="text-white" />
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="font-medium text-wa-text">Meu status</span>
                    <span className="text-sm text-wa-text-muted">
                      {myStatuses.length > 0 ? format(myStatuses[0].timestamp, 'HH:mm') : 'Toque para atualizar seu status'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {myStatuses.length > 0 && (
                      <button 
                         className="flex items-center gap-1 text-wa-text-muted hover:bg-wa-active-tab p-2 rounded-lg transition-colors"
                         onClick={(e) => { e.stopPropagation(); setIsStatusViewsOpen(true); }}
                      >
                         <Eye size={18} />
                         <span className="text-xs font-bold">{myStatuses[0].viewers?.length || 0}</span>
                      </button>
                    )}
                    <button 
                      className="text-wa-green p-2 hover:bg-wa-bg rounded-full border border-wa-border-light"
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        document.getElementById('status-camera-input')?.click();
                      }}
                    >
                      <Camera size={20} />
                    </button>
                    <input 
                      id="status-camera-input"
                      type="file" 
                      accept="image/*,video/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const isVideo = file.type.startsWith('video/');
                          handleImageUpload(e, (url) => {
                            if (isVideo) {
                              setVideoStatusUrl(url);
                              setCreatingStatus(StatusType.VIDEO);
                            } else {
                              setImageStatusUrl(url);
                              setCreatingStatus(StatusType.IMAGE);
                            }
                          });
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Status Sections */}
                <div className="px-4 py-3 text-wa-text font-bold text-[15px] bg-[#f0f2f5] dark:bg-[#111b21] sticky top-0 z-10 border-b border-wa-border dark:border-white/5">
                  Atualizações recentes
                </div>

                {Object.keys(contactStatusesGrouped).length === 0 ? (
                  <div className="p-10 text-wa-text-muted text-sm text-center italic">
                    Nenhuma atualização de status para mostrar
                  </div>
                ) : (
                  Object.entries(contactStatusesGrouped).map(([contactId, stats]) => {
                    const contact = contacts.find(c => c.id === contactId);
                    return (
                      <div 
                        key={contactId} 
                        className="flex items-center p-4 gap-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-b border-wa-border dark:border-white/5 last:border-0"
                        onClick={() => {
                          setViewingStatus(stats);
                          setCurrentStatusIndex(0);
                        }}
                      >
                        <div className="relative p-0.5 rounded-full border-2 border-[#25d366]">
                           <img src={contact?.avatar} className="w-11 h-11 rounded-full border-2 border-wa-header object-cover" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-wa-text">{contact?.name}</span>
                          <span className="text-sm text-wa-text-muted">{format(stats[0].timestamp, 'HH:mm')}</span>
                        </div>
                      </div>
                    );
                  })
                )}

                <div className="h-[1px] bg-wa-border dark:bg-white/5 mx-4 my-4" />

                {/* Channels Section */}
                <div className="p-4 pt-2">
                   <div className="flex justify-between items-center mb-4">
                      <h2 className="text-[17px] font-bold text-wa-text">Canais</h2>
                      <span className="text-[#25d366] text-sm font-bold">Ver tudo</span>
                   </div>
                   <p className="text-wa-text-muted text-[13px] mb-4">Mantenha-se atualizado com os assuntos que você gosta. Encontre canais para seguir abaixo.</p>
                   
                   <div className="space-y-5 pb-16">
                      {[
                        { name: 'WhatsApp', followers: '169 Mi de seguidores', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=WA&backgroundColor=25d366' },
                        { name: 'G1', followers: '12 Mi de seguidores', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=G1&backgroundColor=cc0000' },
                        { name: 'Netflix', followers: '45 Mi de seguidores', avatar: 'https://api.dicebear.com/7.x/initials/svg?seed=N&backgroundColor=000000' }
                      ].map(channel => (
                        <div key={channel.name} className="flex items-center gap-3">
                           <img src={channel.avatar} className="w-12 h-12 rounded-full border border-black/5 shadow-sm" />
                           <div className="flex-1">
                              <h3 className="text-[16px] font-bold text-wa-text">{channel.name}</h3>
                              <p className="text-[13px] text-wa-text-muted">{channel.followers}</p>
                           </div>
                           <button className="px-4 py-1.5 bg-[#25d366]/10 text-[#25d366] dark:bg-[#25d366]/20 rounded-full text-sm font-bold active:scale-95 transition-transform">Seguir</button>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            )}
            {activeTab === 'comunidades' && (
              <div className="flex flex-col items-center justify-center p-10 text-center mt-20">
                <div className="bg-wa-border-light p-6 rounded-2xl mb-4 text-wa-text-muted">
                  <Users size={64} />
                </div>
                <h2 className="text-xl font-bold mb-2">Apresentando as Comunidades</h2>
                <p className="text-wa-text-muted text-sm max-w-[280px]">
                  Organize facilmente seus grupos relacionados e envie avisos. Agora, suas comunidades, como bairros ou escolas, podem ter seu próprio espaço.
                </p>
                <button className="mt-8 bg-wa-green-dark text-white px-8 py-2 rounded-full font-bold">
                  Iniciar sua comunidade
                </button>
              </div>
            )}

            {activeTab === 'chamadas' && (
              <div className="flex flex-col">
                <div className="p-4 flex flex-col gap-6">
                  <div className="flex items-center gap-4 cursor-pointer">
                    <div className="w-12 h-12 rounded-full bg-wa-green flex items-center justify-center text-white">
                      <Plus size={24} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-wa-text">Criar link de chamada</span>
                      <span className="text-sm text-wa-text-muted">Compartilhe um link para sua chamada do WhatsApp</span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="font-bold text-wa-text text-[15px]">Recentes</span>
                  </div>
                  <div className="flex flex-col items-center justify-center py-20 text-wa-text-muted text-sm italic">
                    Nenhuma chamada recente
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Bottom Navigation */}
          {!isSearching && (
            <div className="fixed bottom-0 left-0 right-0 bg-wa-header dark:bg-[#111b21] border-t border-wa-border dark:border-white/5 flex justify-around items-center pt-2 pb-[env(safe-area-inset-bottom,12px)] z-30 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
              {[
                { id: 'conversas', label: 'Conversas', icon: MessageSquare, badge: 2 },
                { id: 'status', label: 'Atualizações', icon: CircleDashed, badge: 1 },
                { id: 'comunidades', label: 'Comunidades', icon: Users },
                { id: 'chamadas', label: 'Chamadas', icon: Phone },
              ].map((tab) => (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className="flex flex-col items-center gap-1 flex-1 relative group py-1"
                >
                  <div className={cn(
                    "px-5 py-1.5 rounded-full transition-all duration-400 relative",
                    activeTab === tab.id ? "bg-[#dcf8c6] dark:bg-[#005c4b]/30" : "group-hover:bg-black/5 dark:group-hover:bg-white/5"
                  )}>
                    <tab.icon 
                      size={22} 
                      className={cn(
                        "transition-all duration-400",
                        activeTab === tab.id ? "text-[#008069] dark:text-[#25d366] fill-[#008069] dark:fill-[#25d366]" : "text-wa-text-muted"
                      )} 
                    />
                    {tab.badge && (
                      <div className="absolute -top-1 -right-1 bg-[#25d366] text-[#0b141a] text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-wa-header dark:border-[#111b21]">
                        {tab.badge}
                      </div>
                    )}
                  </div>
                  <span className={cn(
                    "text-[11px] font-bold tracking-tight transition-colors duration-400",
                    activeTab === tab.id ? "text-wa-text" : "text-wa-text-muted"
                  )}>
                    {tab.label}
                  </span>
                </button>
              ))}
            </div>
          )}

          <AnimatePresence>
            {activeTab === 'conversas' && (
              <div className="fixed bottom-24 right-5 flex flex-col gap-4 z-40">
                <motion.button 
                  initial={{ scale: 0, rotate: -45 }} 
                  animate={{ scale: 1, rotate: 0 }} 
                  exit={{ scale: 0, rotate: -45 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                  onClick={() => setIsContactSelectorOpen(true)}
                  className="w-14 h-14 bg-[#25d366] rounded-2xl flex items-center justify-center shadow-lg shadow-black/20 text-[#0b141a] hover:scale-105 active:scale-95 transition-transform"
                >
                  <MessageSquare size={26} className="fill-[#0b141a]" />
                </motion.button>
              </div>
            )}
            {activeTab === 'status' && (
              <div className="fixed bottom-24 right-6 flex flex-col gap-4 z-10">
                <motion.button 
                  initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                  onClick={() => {
                      const cid = contacts[Math.floor(Math.random() * contacts.length)].id;
                      const id = Math.random().toString(36).substring(2, 11);
                      const newStatus: Status = {
                          id,
                          creatorId: cid,
                          type: StatusType.TEXT,
                          content: 'Status falso do contato!',
                          backgroundColor: '#9255c2',
                          timestamp: Date.now(),
                          expiresAt: Date.now() + 24 * 60 * 60 * 1000,
                          viewers: []
                      };
                      setStatuses([newStatus, ...statuses]);
                  }}
                  className="w-12 h-12 bg-[#34B7F1] rounded-full flex items-center justify-center shadow-md text-white hover:scale-105 transition-transform"
                  title="Adicionar Status Fake"
                >
                  <Plus size={20} />
                </motion.button>
                <motion.button 
                  initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                  onClick={() => setCreatingStatus(StatusType.TEXT)}
                  className="w-12 h-12 bg-wa-bg rounded-full flex items-center justify-center shadow-md text-wa-text-secondary hover:scale-105 transition-all border border-wa-border"
                >
                  <Pencil size={20} />
                </motion.button>
                <motion.button 
                  initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                  onClick={() => setCreatingStatus(StatusType.VIDEO)}
                  className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center shadow-md text-white hover:scale-105 transition-all border border-white/20"
                  title="Novo Status de Vídeo"
                >
                  <Video size={20} />
                </motion.button>
                <motion.button 
                  initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                  onClick={() => {
                     document.getElementById('status-camera-input')?.click();
                  }}
                  className="w-14 h-14 bg-wa-green rounded-full flex items-center justify-center shadow-lg text-white hover:scale-105 transition-transform"
                >
                  <Camera size={24} />
                </motion.button>
              </div>
            )}
          </AnimatePresence>

          {/* Contact Selector Screen (New WhatsApp Style) */}
          <AnimatePresence>
            {isContactSelectorOpen && (
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200, duration: 0.3 }}
                className="fixed inset-0 z-[150] bg-wa-bg flex flex-col pt-[env(safe-area-inset-top)]"
              >
                {/* Header */}
                <div className="bg-wa-header p-2 flex items-center gap-4 px-4 h-[64px] border-b border-wa-border shrink-0">
                  <button onClick={() => setIsContactSelectorOpen(false)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                    <ArrowLeft size={24} className="text-wa-text" />
                  </button>
                  <div className="flex flex-col">
                    <h2 className="text-[17px] font-bold text-wa-text leading-tight">Selecionar contato</h2>
                    <span className="text-[11px] text-wa-text-muted uppercase tracking-wider font-bold">{contacts.length} contatos</span>
                  </div>
                  <div className="ml-auto flex items-center gap-1">
                    <button className="p-2 hover:bg-black/5 rounded-full transition-colors">
                      <Search size={22} className="text-wa-text" />
                    </button>
                    <button className="p-2 hover:bg-black/5 rounded-full transition-colors">
                      <MoreVertical size={22} className="text-wa-text" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto no-scrollbar bg-wa-bg">
                  {/* Shortcut Actions */}
                  <div className="py-2 px-1">
                    {[
                      { icon: Users, label: 'Novo grupo', color: 'bg-wa-green' },
                      { icon: UserPlus, label: 'Novo contato', color: 'bg-wa-green', right: QrCode },
                      { icon: Users, label: 'Nova comunidade', color: 'bg-wa-green' }
                    ].map((item, idx) => (
                      <div 
                        key={idx}
                        className={cn(
                          "flex items-center gap-4 py-3 px-4 hover:bg-black/5 active:bg-black/10 cursor-pointer transition-colors group",
                          idx === 2 && "border-b border-wa-border-light pb-5 mb-2"
                        )}
                        onClick={() => {
                          if (item.label === 'Novo contato') {
                            handleAddContact();
                            setIsContactSelectorOpen(false);
                          }
                        }}
                      >
                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-[#004a3a] shadow-sm", item.color)}>
                          <item.icon size={20} />
                        </div>
                        <div className="flex-1 flex justify-between items-center">
                          <span className="font-bold text-[16px] text-wa-text">{item.label}</span>
                          {item.right && <item.right size={18} className="text-wa-text-muted" />}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Contacts on WhatsApp */}
                  <div className="pb-10">
                    <div className="px-5 py-3 text-wa-text-muted text-[12px] font-bold uppercase tracking-widest bg-wa-bg/80 backdrop-blur-sm sticky top-0 z-10">
                      Contatos no WhatsApp
                    </div>
                    {contacts
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(contact => (
                        <div 
                          key={contact.id}
                          className="flex items-center p-3 px-5 gap-4 hover:bg-black/5 active:bg-black/10 cursor-pointer transition-colors group select-none"
                          onClick={() => {
                            const existingChat = chats.find(c => c.contactId === contact.id);
                            if (existingChat) {
                              setActiveChatId(existingChat.id);
                            } else {
                              handleAddChat(contact.id);
                            }
                            setIsContactSelectorOpen(false);
                          }}
                        >
                          <div className="relative">
                            <img src={contact.avatar} alt="" className="w-12 h-12 rounded-full object-cover border border-wa-border-light shadow-sm" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[16px] font-bold text-wa-text truncate leading-tight mb-0.5">{contact.name}</div>
                            <div className="text-[13px] text-wa-text-muted truncate">{contact.status || 'Olá! Eu estou usando o WhatsApp.'}</div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      ) : (
        (() => {
          const activeChat = chats.find(c => c.id === activeChatId);
          const activeContact = activeChat ? contacts.find(c => c.id === activeChat.contactId) : null;
          
          if (!activeChat || !activeContact) {
            return <div className="flex h-screen items-center justify-center p-10 text-center">Chat não encontrado</div>;
          }

          return (
            <ChatScreen 
              theme={theme}
              setEditingContact={setEditingContact}
              myProfile={myProfile}
              chat={activeChat} 
              contact={activeContact}
              messages={messages.filter(m => m.chatId === activeChatId)}
              isTyping={typingChats[activeChatId!] || false}
              onBack={() => setActiveChatId(null)}
              handleReact={handleReact}
              handleForward={handleForward}
              forwardingMessage={forwardingMessage}
              setForwardingMessage={setForwardingMessage}
              messageContextMenu={messageContextMenu}
              setMessageContextMenu={setMessageContextMenu}
              contacts={contacts}
              chats={chats}
              setChats={setChats}
              setMessages={setMessages}
              onCall={(type) => setIsCalling({ contact: activeContact, type })}
              onSendMessage={(content, type, senderOverride) => {
                const newMessage: Message = {
                  id: Math.random().toString(36).substring(2, 11),
                  chatId: activeChatId!,
                  senderId: senderOverride || 'me',
                  type,
                  content,
                  timestamp: Date.now(),
                  isRead: true
                };
                setMessages(prev => [...prev, newMessage]);
                setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, lastMessage: newMessage } : c));

                // Trigger AI response if enabled and sent by user
                if (isAISmartReplyEnabled && (!senderOverride || senderOverride === 'me')) {
                  setTimeout(() => {
                    handleAIRespond(activeChatId!, content, type);
                  }, 1000 + Math.random() * 2000); 
                }
              }}
              onSendFakeResponse={(content, type) => {
                const contactId = activeChat.contactId;
                const contact = contacts.find(c => c.id === contactId);
                const newMessage: Message = {
                  id: Math.random().toString(36).substring(2, 11),
                  chatId: activeChatId!,
                  senderId: contactId,
                  type,
                  content,
                  timestamp: Date.now(),
                  isRead: false
                };
                setMessages(prev => [...prev, newMessage]);
                setChats(prev => prev.map(c => c.id === activeChatId ? { ...c, lastMessage: newMessage } : c));
                if (contact) {
                  triggerNotification(contact, type === MessageType.TEXT ? content : `[${type}]`);
                }
              }}
            />
          );
        })()
      )}

      {/* These should be outside the main conditional since they appear on top of everything */}
      
      {/* Status Creator Modal */}
      <AnimatePresence>
        {creatingStatus === StatusType.TEXT && (
          <motion.div 
            initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
            className="fixed inset-0 z-50 flex flex-col"
            style={{ backgroundColor: statusBg }}
          >
            <div className="flex justify-between p-4 list-none text-white">
              <button 
                onClick={() => setCreatingStatus(null)}
                className="text-white"
              >
                <ArrowLeft size={24} />
              </button>
              <div className="flex gap-6">
                <button 
                  onClick={() => {
                    const colors = ['#25D366', '#00a884', '#128C7E', '#34B7F1', '#667781', '#74676a', '#9255c2'];
                    const currentIdx = colors.indexOf(statusBg);
                    setStatusBg(colors[(currentIdx + 1) % colors.length]);
                  }}
                >
                  <div className="w-6 h-6 rounded-full border-2 border-white" style={{ background: statusBg }} />
                </button>
                <button onClick={handleAddStatus}>
                  <Send size={24} />
                </button>
              </div>
            </div>
            <div className="flex-1 flex items-center justify-center px-8">
              <textarea
                autoFocus
                placeholder="Digite seu status"
                className="bg-transparent border-none outline-none text-3xl font-medium text-white text-center w-full resize-none placeholder:text-white/50"
                value={statusText}
                onChange={(e) => setStatusText(e.target.value)}
                rows={4}
              />
            </div>
          </motion.div>
        )}

        {(creatingStatus === StatusType.IMAGE || creatingStatus === StatusType.VIDEO) && (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-6"
          >
            <div className="absolute top-4 left-4 right-4 flex justify-between items-center text-white z-10">
              <button onClick={() => setCreatingStatus(null)}><ArrowLeft size={24} /></button>
              <h3 className="font-bold">Status de {creatingStatus === StatusType.IMAGE ? 'Imagem' : 'Vídeo'}</h3>
              <button 
                onClick={handleAddStatus}
                className="bg-wa-green text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-md"
              >
                Postar
              </button>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm gap-6 relative">
              {isRecording ? (
                <div className="relative w-full aspect-[9/16] bg-black rounded-2xl overflow-hidden shadow-2xl flex flex-col items-center justify-center">
                   <div className="absolute top-4 right-4 bg-red-600 text-white px-2 py-1 rounded text-xs font-bold animate-pulse flex items-center gap-1">
                      <div className="w-2 h-2 bg-white rounded-full" />
                      REC {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, '0')}
                   </div>
                   <video 
                     autoPlay 
                     muted 
                     ref={(ref) => { if(ref && streamRef.current) ref.srcObject = streamRef.current; }} 
                     className="w-full h-full object-cover"
                   />
                   <button 
                     onClick={stopRecording}
                     className="absolute bottom-8 w-16 h-16 bg-red-600 rounded-full border-4 border-white shadow-xl flex items-center justify-center text-white"
                   >
                     <div className="w-6 h-6 bg-white rounded-sm" />
                   </button>
                </div>
              ) : (creatingStatus === StatusType.IMAGE ? imageStatusUrl : videoStatusUrl) ? (
                <div className="relative w-full aspect-square md:aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl bg-[#202c33] flex items-center justify-center">
                   {creatingStatus === StatusType.IMAGE ? (
                     <img src={imageStatusUrl} alt="Preview" className="w-full h-full object-contain" />
                   ) : (
                     <video src={videoStatusUrl} controls className="w-full h-full object-contain" />
                   )}
                   <button 
                    onClick={() => {
                      if (creatingStatus === StatusType.IMAGE) setImageStatusUrl('');
                      else setVideoStatusUrl('');
                    }}
                    className="absolute top-4 right-4 bg-black/60 text-white p-2 rounded-full hover:bg-black/80 transition-colors"
                   >
                     <Plus size={24} className="rotate-45" />
                   </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4 w-full">
                  <div 
                    className="w-full aspect-square bg-[#202c33] rounded-2xl border-2 border-dashed border-wa-border-light flex flex-col items-center justify-center text-wa-text-muted cursor-pointer hover:bg-black/20 transition-colors"
                    onClick={() => document.getElementById('media-status-input')?.click()}
                  >
                     {creatingStatus === StatusType.IMAGE ? <ImageIcon size={64} className="mb-4 opacity-50" /> : <Video size={64} className="mb-4 opacity-50" />}
                     <p className="font-medium text-center px-4">Clique para escolher {creatingStatus === StatusType.IMAGE ? 'uma imagem' : 'um vídeo'}</p>
                  </div>
                  
                  {creatingStatus === StatusType.VIDEO && (
                    <button 
                      onClick={startRecording}
                      className="w-full py-4 bg-wa-green/10 text-wa-green border border-wa-green/20 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-wa-green/20 transition-colors"
                    >
                      <Camera size={20} />
                      Gravar Vídeo Agora
                    </button>
                  )}
                </div>
              )}
              
              <input 
                id="media-status-input"
                type="file" 
                accept={creatingStatus === StatusType.IMAGE ? "image/*" : "video/*"}
                className="hidden"
                onChange={(e) => {
                  const isVideo = creatingStatus === StatusType.VIDEO;
                  handleImageUpload(e, (url) => {
                    if (isVideo) setVideoStatusUrl(url);
                    else setImageStatusUrl(url);
                  });
                }}
              />
              
              <div className="w-full">
                <label className="text-xs text-wa-green font-bold uppercase block mb-2 px-1">Ou insira URL:</label>
                <input 
                  type="text" 
                  placeholder={`https://exemplo.com/${creatingStatus === StatusType.IMAGE ? 'imagem.png' : 'video.mp4'}`}
                  className="w-full bg-[#202c33] border border-wa-border-light rounded-xl p-3 text-white text-sm outline-none focus:border-wa-green transition-colors"
                  value={creatingStatus === StatusType.IMAGE ? imageStatusUrl : videoStatusUrl}
                  onChange={(e) => {
                    if (creatingStatus === StatusType.IMAGE) setImageStatusUrl(e.target.value);
                    else setVideoStatusUrl(e.target.value);
                  }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Views Modal */}
      <AnimatePresence>
        {isStatusViewsOpen && (
          <Modal title="Quem viu seus status" onClose={() => setIsStatusViewsOpen(false)}>
             <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="text-sm text-wa-text-muted mb-2 font-medium">
                  {viewingStatus && viewingStatus[currentStatusIndex]?.viewers?.length 
                    ? `${viewingStatus[currentStatusIndex].viewers.length} visualizações`
                    : "Nenhuma visualização ainda"}
                </div>
                {viewingStatus && viewingStatus[currentStatusIndex]?.viewers?.length ? (
                  viewingStatus[currentStatusIndex].viewers.map(viewerId => {
                    const contact = contacts.find(c => c.id === viewerId);
                    if (!contact) return null;
                    return (
                      <div key={viewerId} className="flex items-center gap-4 animate-in fade-in slide-in-from-bottom-2">
                        <img src={contact.avatar} alt="" className="w-11 h-11 rounded-full object-cover border border-wa-border" />
                        <div className="flex flex-col flex-1">
                          <span className="font-semibold text-wa-text">{contact.name}</span>
                          <span className="text-[12px] text-wa-text-muted tracking-tight">Hoje às {format(Date.now() - Math.random() * 1000000, 'HH:mm')}</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-center gap-3 opacity-60">
                     <Eye size={48} className="text-wa-border" />
                     <p className="text-sm">As visualizações aparecerão aqui quando seus contatos virem seus status.</p>
                  </div>
                )}
             </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Status Viewer */}
      <AnimatePresence>
        {viewingStatus && (
          <motion.div 
            initial={{ scale: 1.2, opacity: 0 }} 
            animate={{ scale: 1, opacity: 1 }} 
            exit={{ scale: 1.2, opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col select-none"
          >
            {/* Progress Bars */}
            <div className="flex gap-1 p-2 bg-black/40 pt-6 z-10">
              {viewingStatus.map((_, i) => (
                <div key={i} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    key={`${currentStatusIndex}-${i}`}
                    onAnimationEnd={() => {
                        if (viewingStatus && i === currentStatusIndex) {
                          if (currentStatusIndex < viewingStatus.length - 1) {
                             setCurrentStatusIndex(prev => prev + 1);
                             setIsVideoPaused(false);
                          } else {
                             setViewingStatus(null);
                             setIsVideoPaused(false);
                          }
                        }
                    }}
                    style={{ 
                      animationPlayState: isVideoPaused ? 'paused' : 'running',
                      animationDuration: i === currentStatusIndex ? `${viewingStatus[i].type === StatusType.VIDEO ? videoDuration : 5}s` : undefined
                    }}
                    className={cn(
                      "h-full bg-white",
                      i === currentStatusIndex ? "animate-status-progress" : (i < currentStatusIndex ? "w-full" : "w-0")
                    )}
                  />
                </div>
              ))}
            </div>

            {/* Top Bar */}
            <div className="flex items-center p-4 gap-3 text-white z-10 bg-gradient-to-b from-black/50 to-transparent">
              <ArrowLeft size={24} onClick={() => { setViewingStatus(null); setIsVideoPaused(false); }} className="cursor-pointer" />
              <img 
                src={viewingStatus[currentStatusIndex].creatorId === 'me' ? myProfile.avatar : contacts.find(c => c.id === viewingStatus[currentStatusIndex].creatorId)?.avatar} 
                alt="" 
                className="w-10 h-10 rounded-full object-cover" 
              />
              <div className="flex flex-col">
                <span className="font-medium">
                  {viewingStatus[currentStatusIndex].creatorId === 'me' ? 'Meu status' : contacts.find(c => c.id === viewingStatus[currentStatusIndex].creatorId)?.name}
                </span>
                <span className="text-xs opacity-70">{format(viewingStatus[currentStatusIndex].timestamp, 'HH:mm')}</span>
              </div>
              <div className="relative ml-auto">
                <MoreVertical 
                  size={24} 
                  className="cursor-pointer" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsStatusMenuOpen(!isStatusMenuOpen);
                    setIsVideoPaused(true);
                  }} 
                />
                <AnimatePresence>
                  {isStatusMenuOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => {
                          setIsStatusMenuOpen(false);
                          setIsVideoPaused(false);
                        }} 
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -10 }}
                        className="absolute right-0 top-full mt-2 bg-white dark:bg-[#233138] shadow-xl rounded-lg py-2 w-48 z-50 border dark:border-white/5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button 
                          className="w-full text-left px-4 py-3 hover:bg-wa-bg dark:hover:bg-white/5 text-wa-text font-medium"
                          onClick={() => {
                            setEditingStatusItem(viewingStatus[currentStatusIndex]);
                            setIsStatusMenuOpen(false);
                          }}
                        >
                          Editar status
                        </button>
                        <button 
                          className="w-full text-left px-4 py-3 hover:bg-wa-bg dark:hover:bg-white/5 text-wa-text"
                          onClick={() => {
                            handleDeleteStatus(viewingStatus[currentStatusIndex].id);
                          }}
                        >
                          Excluir status
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Content Area */}
            <div 
              className="flex-1 flex items-center justify-center p-6 relative bg-black"
              style={{ backgroundColor: viewingStatus[currentStatusIndex].type === StatusType.TEXT ? viewingStatus[currentStatusIndex].backgroundColor : 'black' }}
            >
              {/* Navigation overlays */}
              <div 
                className="absolute left-0 top-0 bottom-0 w-[30%] z-20 cursor-pointer" 
                onClick={(e) => {
                  e.stopPropagation();
                  if (currentStatusIndex > 0) {
                    setCurrentStatusIndex(prev => prev - 1);
                    setIsVideoPaused(false);
                  }
                }}
              />
              <div 
                className="absolute right-0 top-0 bottom-0 w-[70%] z-20 cursor-pointer" 
                onClick={(e) => {
                  e.stopPropagation();
                  if (currentStatusIndex < viewingStatus.length - 1) {
                    setCurrentStatusIndex(prev => prev + 1);
                    setIsVideoPaused(false);
                  } else {
                    setViewingStatus(null);
                    setIsVideoPaused(false);
                  }
                }}
              />

              {viewingStatus[currentStatusIndex].type === StatusType.TEXT ? (
                <p className="text-3xl font-medium text-center text-white break-words max-w-full">
                  {viewingStatus[currentStatusIndex].content}
                </p>
              ) : viewingStatus[currentStatusIndex].type === StatusType.IMAGE ? (
                <img src={viewingStatus[currentStatusIndex].content} alt="Status" className="max-w-full max-h-full object-contain" />
              ) : (
                <div className="relative w-full h-full flex items-center justify-center">
                  <video 
                    ref={videoRef}
                    src={viewingStatus[currentStatusIndex].content} 
                    autoPlay 
                    playsInline
                    className="max-w-full max-h-full"
                    onLoadedMetadata={(e) => {
                      const duration = e.currentTarget.duration;
                      if (duration && !isNaN(duration)) {
                        setVideoDuration(duration);
                      }
                    }}
                    onPlay={() => setIsVideoPaused(false)}
                    onPause={() => setIsVideoPaused(true)}
                  />
                  
                  {/* Video Controls Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center gap-10 z-30 opacity-0 hover:opacity-100 transition-opacity bg-black/20">
                    <button 
                      className="p-3 bg-black/40 rounded-full text-white hover:bg-black/60 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (videoRef.current) {
                          videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
                        }
                      }}
                    >
                      <RotateCcw size={24} />
                      <span className="text-[10px] block mt-1">10s</span>
                    </button>
                    
                    <button 
                      className="p-5 bg-wa-green/80 rounded-full text-[#004a3a] hover:bg-wa-green transition-colors shadow-lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (videoRef.current) {
                          if (videoRef.current.paused) videoRef.current.play();
                          else videoRef.current.pause();
                        }
                      }}
                    >
                      {isVideoPaused ? <Play size={32} fill="currentColor" /> : <Pause size={32} fill="currentColor" />}
                    </button>
                    
                    <button 
                      className="p-3 bg-black/40 rounded-full text-white hover:bg-black/60 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (videoRef.current) {
                          videoRef.current.currentTime = Math.min(videoRef.current.duration, videoRef.current.currentTime + 10);
                        }
                      }}
                    >
                      <RotateCw size={24} />
                      <span className="text-[10px] block mt-1">10s</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Bar */}
            {/* Reply Bar */}
            {viewingStatus[currentStatusIndex].creatorId !== 'me' && (
               <div className="p-4 z-30 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 border border-white/20">
                     <button className="text-white opacity-70"><Plus size={20} /></button>
                     <input 
                        type="text" 
                        placeholder="Responder"
                        className="bg-transparent border-none outline-none flex-1 text-white placeholder:text-white/50 text-sm"
                        value={statusReplyText}
                        onChange={(e) => setStatusReplyText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleStatusReply();
                        }}
                     />
                     <button 
                        onClick={handleStatusReply}
                        className={cn(
                          "transition-all",
                          statusReplyText ? "text-wa-green scale-110" : "text-white opacity-40 scale-100"
                        )}
                        disabled={!statusReplyText}
                     >
                        <Send size={20} />
                     </button>
                  </div>
               </div>
            )}

            {viewingStatus[currentStatusIndex].creatorId === 'me' && (
               <div 
                 className="p-10 flex flex-col items-center gap-1 cursor-pointer z-40 bg-gradient-to-t from-black/60 to-transparent"
                 onClick={(e) => {
                   e.stopPropagation();
                   setIsStatusViewsOpen(true);
                 }}
               >
                  <div className="text-white flex flex-col items-center hover:scale-105 transition-transform">
                     <div className="flex items-center gap-2">
                        <Eye size={20} />
                        <span className="text-sm font-bold tracking-tight">
                           {viewingStatus[currentStatusIndex].viewers?.length || 0} visualizações
                        </span>
                     </div>
                     <div className="w-10 h-1 bg-white/70 rounded-full mt-2" />
                  </div>
               </div>
             )}
           </motion.div>
         )}
       </AnimatePresence>

       {/* Settings Screen (Full-screen Redesign) */}
      <AnimatePresence>
        {isSettingsOpen && (
          <motion.div
             initial={{ x: '100%' }}
             animate={{ x: 0 }}
             exit={{ x: '100%' }}
             transition={{ type: 'spring', damping: 25, stiffness: 200 }}
             className="fixed inset-0 z-[200] bg-[#f0f2f5] dark:bg-[#0b141a] flex flex-col overflow-y-auto no-scrollbar"
          >
            {/* Header */}
            <div className="sticky top-0 z-50 bg-wa-header dark:bg-[#111b21] flex items-center p-4 gap-6 shadow-sm">
               <button 
                 onClick={() => setIsSettingsOpen(false)}
                 className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
               >
                  <ArrowLeft size={24} className="text-wa-text" />
               </button>
               <h1 className="text-xl font-medium text-wa-text">Configurações</h1>
            </div>

            {/* Profile Bar */}
            <div 
              className="bg-white dark:bg-[#111b21] p-4 flex items-center gap-4 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-b dark:border-white/5"
              onClick={() => {
                // Focus on editing name/photo
                // For now just keep it open
              }}
            >
               <div className="relative group shrink-0" onClick={(e) => { e.stopPropagation(); document.getElementById('profile-photo-input-settings')?.click(); }}>
                  <img src={myProfile.avatar} className="w-16 h-16 rounded-full object-cover border border-black/5 shadow-sm" />
                  <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                     <Camera size={20} className="text-white" />
                  </div>
                  <input 
                    id="profile-photo-input-settings"
                    type="file" 
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e, (url) => setMyProfile({ ...myProfile, avatar: url }))}
                  />
               </div>
               <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between">
                     <input 
                        className="bg-transparent border-none outline-none font-medium text-[19px] text-wa-text w-full"
                        value={myProfile.name}
                        onChange={(e) => setMyProfile({ ...myProfile, name: e.target.value })}
                     />
                  </div>
                  <div className="text-[14px] text-wa-text-muted truncate mt-0.5">Disponível</div>
               </div>
               <div className="flex gap-4 items-center">
                  <QrCode size={24} className="text-[#008069] dark:text-[#25d366]" />
                  <div className="w-8 h-8 rounded-full border border-wa-border dark:border-white/10 flex items-center justify-center">
                     <Plus size={18} className="text-[#008069] dark:text-[#25d366]" />
                  </div>
               </div>
            </div>

            <div className="bg-white dark:bg-[#111b21] mt-2 mb-4 shadow-sm">
               {[
                 { icon: Lock, label: 'Conta', sub: 'Notificações de segurança, mudança de número', color: 'text-wa-text-muted' },
                 { icon: Shield, label: 'Privacidade', sub: 'Bloqueio de contatos, mensagens temporárias', color: 'text-wa-text-muted' },
                 { icon: Smile, label: 'Avatar', sub: 'Criar, editar, foto do perfil', color: 'text-wa-text-muted' },
                 { icon: MessageSquare, label: 'Conversas', sub: 'Tema, papéis de parede, histórico de conversas', color: 'text-wa-text-muted' },
                 { icon: Bell, label: 'Notificações', sub: 'Sons de mensagens, grupos e chamadas', color: 'text-wa-text-muted' },
                 { icon: CircleDashed, label: 'Armazenamento e dados', sub: 'Uso de rede, download automático', color: 'text-wa-text-muted' },
                 { icon: Share2, label: 'Idioma do aplicativo', sub: 'Português (Brasil)', color: 'text-wa-text-muted' },
                 { icon: Info, label: 'Ajuda', sub: 'Central de ajuda, fale conosco, política de privacidade', color: 'text-wa-text-muted' }
               ].map((item, idx) => (
                 <div key={idx} className="flex items-center gap-6 p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer border-b last:border-0 dark:border-white/5">
                    <item.icon size={22} className={cn("shrink-0", item.color)} />
                    <div className="flex-1 overflow-hidden">
                       <div className="text-[16px] text-wa-text font-medium">{item.label}</div>
                       <div className="text-[13px] text-wa-text-muted truncate mt-0.5">{item.sub}</div>
                    </div>
                 </div>
               ))}
               
               <div className="p-4 flex items-center gap-6 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer text-wa-text-muted">
                  <Users size={22} className="shrink-0" />
                  <div className="text-[16px] font-medium text-wa-text">Convidar um amigo</div>
               </div>
            </div>

            {/* AI Config Section */}
            <div className="bg-white dark:bg-[#111b21] p-4 mb-2 shadow-sm">
               <div className="flex items-start justify-between">
                  <div className="flex gap-6">
                     <Smile size={22} className="text-[#25d366] shrink-0 mt-1" />
                     <div>
                        <div className="flex items-center gap-2">
                           <span className="font-medium text-[16px] text-wa-text">Respostas Inteligentes (IA)</span>
                           <span className="bg-[#25d366] text-[#0b141a] text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase">Beta</span>
                        </div>
                        <p className="text-[13px] text-wa-text-muted mt-0.5 leading-relaxed">
                           Use o poder do Gemini AI para responder seus contatos automaticamente com base nas mensagens recebidas.
                        </p>
                     </div>
                  </div>
                  <button 
                     onClick={(e) => { e.stopPropagation(); setIsAISmartReplyEnabled(!isAISmartReplyEnabled); }}
                     className={cn(
                        "w-10 h-5 rounded-full relative transition-all flex items-center px-0.5 shrink-0 ml-4",
                        isAISmartReplyEnabled ? "bg-[#25d366]" : "bg-wa-border dark:bg-white/10"
                     )}
                  >
                     <div className={cn(
                        "w-4 h-4 bg-white rounded-full transition-transform",
                        isAISmartReplyEnabled ? "translate-x-5" : "translate-x-0"
                     )} />
                  </button>
               </div>
            </div>

            {/* Footer */}
            <div className="mt-6 mb-12 flex flex-col items-center gap-1 opacity-60">
               <span className="text-[11px] text-wa-text-muted uppercase tracking-[1px]">from</span>
               <div className="flex items-center gap-1.5 grayscale">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg" className="w-5 h-5 invert dark:invert-0" alt="" />
                  <span className="text-sm font-bold text-wa-text tracking-wider">Meta</span>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contact Info Screen (Modern WhatsApp Redesign) */}
      <AnimatePresence>
        {editingContact && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[150] bg-[#f0f2f5] dark:bg-[#0b141a] flex flex-col overflow-y-auto no-scrollbar"
          >
            {/* Sticky Header */}
            <div className="sticky top-0 z-50 bg-wa-header dark:bg-[#111b21] flex items-center justify-between p-3 px-4 shadow-sm">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => {
                    setEditingContact(null);
                    setIsEditingContactInfo(false);
                  }}
                  className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
                >
                  <ArrowLeft size={24} className="text-wa-text" />
                </button>
              </div>
              <div className="relative">
                <button 
                  onClick={() => setIsContactInfoMenuOpen(!isContactInfoMenuOpen)}
                  className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
                >
                  <MoreVertical size={24} className="text-wa-text" />
                </button>

                <AnimatePresence>
                  {isContactInfoMenuOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsContactInfoMenuOpen(false)} 
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: -10 }}
                        className="absolute right-0 top-full mt-1 bg-white dark:bg-[#233138] shadow-xl rounded-lg py-2 w-48 z-50 border dark:border-white/5"
                      >
                        <button 
                          className="w-full text-left px-4 py-3 hover:bg-wa-bg dark:hover:bg-white/5 text-wa-text"
                          onClick={() => {
                            setIsEditingContactInfo(true);
                            setIsContactInfoMenuOpen(false);
                          }}
                        >
                          Editar contato
                        </button>
                        <button className="w-full text-left px-4 py-3 hover:bg-wa-bg dark:hover:bg-white/5 text-wa-text">Compartilhar</button>
                         <button 
                           className="w-full text-left px-4 py-3 hover:bg-wa-bg dark:hover:bg-white/5 text-wa-text"
                           onClick={() => {
                             if (confirm('Deseja realmente limpar todas as mensagens desta conversa?')) {
                               if (activeChatId) {
                                 setMessages(prev => prev.filter(m => m.chatId !== activeChatId));
                                 setIsContactInfoMenuOpen(false);
                               }
                             }
                           }}
                         >
                           Limpar conversa
                         </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Edit Contact Overlay Modal */}
            <AnimatePresence>
              {isEditingContactInfo && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-white dark:bg-[#202c33] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                  >
                    <div className="p-4 bg-wa-header dark:bg-[#111b21] flex items-center gap-4 border-b dark:border-white/5">
                       <button onClick={() => setIsEditingContactInfo(false)} className="text-wa-text">
                         <ArrowLeft size={24} />
                       </button>
                       <h2 className="text-xl font-bold text-wa-text">Editar Contato</h2>
                    </div>
                    <div className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[70vh]">
                       <div className="flex flex-col items-center gap-2">
                          <div className="relative group cursor-pointer" onClick={() => document.getElementById('edit-contact-avatar')?.click()}>
                             <img src={editingContact.avatar} className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-white/10 shadow-md" />
                             <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera size={24} className="text-white" />
                             </div>
                             <input 
                               id="edit-contact-avatar"
                               type="file" 
                               className="hidden" 
                               accept="image/*"
                               onChange={(e) => handleImageUpload(e, (url) => handleUpdateContact(editingContact.id, { avatar: url }))}
                             />
                          </div>
                          <span className="text-xs text-wa-green font-bold uppercase">Mudar foto</span>
                       </div>
                       
                       <div className="flex flex-col gap-1.5">
                          <label className="text-xs text-wa-green font-bold uppercase ml-1">Nome</label>
                          <input 
                             type="text"
                             className="bg-wa-bg dark:bg-[#2a3942] border-b-2 border-wa-green p-3 outline-none text-wa-text text-[17px]"
                             value={editingContact.name}
                             onChange={(e) => handleUpdateContact(editingContact.id, { name: e.target.value })}
                          />
                       </div>

                       <div className="flex flex-col gap-1.5">
                          <label className="text-xs text-wa-green font-bold uppercase ml-1">Telefone</label>
                          <input 
                             type="text"
                             className="bg-wa-bg dark:bg-[#2a3942] border-b-2 border-wa-green p-3 outline-none text-wa-text text-[17px]"
                             value={editingContact.phone || ''}
                             onChange={(e) => handleUpdateContact(editingContact.id, { phone: e.target.value })}
                          />
                       </div>

                       <div className="flex flex-col gap-1.5">
                          <label className="text-xs text-wa-green font-bold uppercase ml-1">Recado</label>
                          <input 
                             type="text"
                             className="bg-wa-bg dark:bg-[#2a3942] border-b-2 border-wa-green p-3 outline-none text-wa-text text-[17px]"
                             value={editingContact.status || ''}
                             onChange={(e) => handleUpdateContact(editingContact.id, { status: e.target.value })}
                          />
                       </div>
                    </div>
                    <div className="p-4 bg-wa-bg dark:bg-[#111b21] flex justify-end gap-3">
                       <button 
                         onClick={() => setIsEditingContactInfo(false)}
                         className="px-6 py-2 rounded-full font-bold text-wa-green uppercase text-sm tracking-wider"
                       >
                         Cancelar
                       </button>
                       <button 
                         onClick={() => setIsEditingContactInfo(false)}
                         className="px-6 py-2 bg-wa-green text-white rounded-full font-bold shadow-md uppercase text-sm tracking-wider"
                       >
                         Salvar
                       </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Profile Section */}
            <div className="bg-white dark:bg-[#111b21] flex flex-col items-center pt-2 pb-6 mb-2 shadow-sm">
              <motion.div 
                layoutId={`avatar-${editingContact.id}`}
                className="w-48 h-48 rounded-full overflow-hidden mb-4 border-2 border-transparent shadow-lg cursor-pointer"
                onClick={() => setFullScreenImage(editingContact.avatar)}
              >
                <img src={editingContact.avatar} alt="" className="w-full h-full object-cover" />
              </motion.div>
              <h1 className="text-2xl font-bold text-wa-text mb-1">{editingContact.name}</h1>
              <p className="text-wa-text-muted text-[17px] font-medium">{editingContact.phone || '+55 11 98888-7777'}</p>
              
              <div className="flex justify-center gap-8 mt-6 w-full max-w-sm">
                {[
                  { icon: MessageSquare, label: 'Mensagem', action: () => {
                    const existingChat = chats.find(c => c.contactId === editingContact.id);
                    if (existingChat) setActiveChatId(existingChat.id);
                    else handleAddChat(editingContact.id);
                    setEditingContact(null);
                  }},
                  { icon: Phone, label: 'Voz', action: () => setIsCalling({ contact: editingContact, type: 'voice' }) },
                  { icon: Video, label: 'Vídeo', action: () => setIsCalling({ contact: editingContact, type: 'video' }) },
                  { icon: QrCode, label: 'Pagar' }
                ].map((action, idx) => (
                  <button 
                    key={idx}
                    onClick={action.action}
                    className="flex flex-col items-center gap-1.5 group outline-none"
                  >
                    <div className="w-12 h-12 flex items-center justify-center text-[#008069] dark:text-[#25d366] group-hover:bg-black/5 dark:group-hover:bg-white/5 rounded-full transition-colors border border-wa-border dark:border-white/5">
                      <action.icon size={22} className={cn(idx < 3 && "fill-current")} />
                    </div>
                    <span className="text-xs font-bold text-[#008069] dark:text-[#25d366]">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* About & Phone */}
            <div className="bg-white dark:bg-[#111b21] p-4 flex flex-col gap-0.5 mb-2 shadow-sm">
              <span className="text-[13px] text-wa-text-muted font-medium mb-2">Recado e número de telefone</span>
              <div className="text-[16px] text-wa-text font-medium leading-relaxed mb-0.5">{editingContact.status || 'Olá! Eu estou usando o WhatsApp.'}</div>
              <span className="text-[13px] text-wa-text-muted">{format(new Date(), 'dd/MM/yyyy')}</span>
              <div className="h-[1px] bg-wa-border dark:bg-white/5 my-3" />
              <div className="flex justify-between items-center">
                <span className="text-[16px] text-wa-text font-medium">{editingContact.phone || '+55 11 98888-7777'}</span>
                <div className="flex gap-4">
                   <MessageSquare 
                     size={20} 
                     className="text-[#008069] dark:text-[#25d366] fill-[#008069] dark:fill-[#25d366] cursor-pointer" 
                     onClick={() => {
                        const existingChat = chats.find(c => c.contactId === editingContact.id);
                        if (existingChat) setActiveChatId(existingChat.id);
                        else handleAddChat(editingContact.id);
                        setEditingContact(null);
                     }}
                   />
                   <Phone 
                     size={20} 
                     className="text-[#008069] dark:text-[#25d366] fill-[#008069] dark:fill-[#25d366] cursor-pointer" 
                     onClick={() => setIsCalling({ contact: editingContact, type: 'voice' })}
                   />
                   <Video 
                     size={20} 
                     className="text-[#008069] dark:text-[#25d366] fill-[#008069] dark:fill-[#25d366] cursor-pointer" 
                     onClick={() => setIsCalling({ contact: editingContact, type: 'video' })}
                   />
                </div>
              </div>
            </div>

            {/* Media/Links Section */}
            <div className="bg-white dark:bg-[#111b21] p-4 flex flex-col gap-3 mb-2 shadow-sm">
              <div 
                className="flex justify-between items-center cursor-pointer hover:opacity-75 transition-opacity"
                onClick={() => {
                  // Reusing status or another gallery if existed, but let's just show an alert or something
                  // For now, clicking individual images works well.
                }}
              >
                <span className="text-[13px] text-wa-text-muted font-bold uppercase tracking-wider">Mídia, links e docs</span>
                <span className="text-[13px] text-wa-text-muted flex items-center gap-1 font-bold">
                  247 <ArrowLeft size={14} className="rotate-180" />
                </span>
              </div>
              <div className="flex gap-2 overflow-x-hidden pt-1">
                 {[1,2,3].map(i => {
                   const imgUrl = `https://picsum.photos/seed/${editingContact.id}-${i}/800`;
                   return (
                     <div 
                       key={i} 
                       className="flex-1 aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border border-black/5 cursor-pointer active:scale-95 transition-transform"
                       onClick={() => setFullScreenImage(imgUrl)}
                     >
                        <img src={imgUrl} className="w-full h-full object-cover" />
                     </div>
                   );
                 })}
                 <div className="flex-1 aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-wa-text-muted cursor-pointer">
                    <Plus size={24} />
                 </div>
              </div>
            </div>

            {/* Settings List */}
            <div className="bg-white dark:bg-[#111b21] mb-2 shadow-sm">
              {[
                { icon: Bell, label: 'Silenciar notificações', right: 'toggle' },
                { icon: ImageIcon, label: 'Personalizar notificações' },
                { icon: ImageIcon, label: 'Visibilidade de mídia' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer border-b border-wa-border dark:border-white/5 last:border-0">
                  <item.icon size={22} className="text-wa-text-muted" />
                  <div className="flex-1 text-[16px] text-wa-text font-medium">{item.label}</div>
                  {item.right === 'toggle' && (
                    <div className="w-10 h-5 bg-wa-border dark:bg-white/10 rounded-full relative">
                       <div className="absolute left-1 top-1 w-3 h-3 bg-white/40 dark:bg-white/20 rounded-full" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Security Section */}
            <div className="bg-white dark:bg-[#111b21] mb-2 shadow-sm">
              <div className="flex items-start gap-4 p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer">
                <Lock size={20} className="text-wa-text-muted mt-1" />
                <div className="flex-1">
                   <div className="text-[16px] text-wa-text font-medium">Criptografia</div>
                   <div className="text-[13px] text-wa-text-muted leading-snug mt-0.5">As mensagens e as chamadas são protegidas com a criptografia de ponta a ponta. Toque para verificar.</div>
                </div>
              </div>
            </div>

            {/* Disappearing Messages */}
            <div className="bg-white dark:bg-[#111b21] mb-2 shadow-sm">
               <div className="flex items-center gap-4 p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer">
                 <Clock size={22} className="text-wa-text-muted" />
                 <div className="flex-1">
                    <div className="text-[16px] text-wa-text font-medium">Mensagens temporárias</div>
                    <div className="text-[13px] text-wa-text-muted">Desativadas</div>
                 </div>
               </div>
            </div>

            {/* Groups in Common */}
            <div className="bg-white dark:bg-[#111b21] mb-2 shadow-sm">
               <div className="p-4 py-3 flex flex-col gap-3">
                  <div className="text-[13px] text-wa-text-muted font-bold uppercase tracking-wider">3 grupos em comum</div>
                  {[
                    { name: 'Família Buscapé', members: 'Mãe, Você, +15', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Family' },
                    { name: 'Viagem 2024', members: 'Mãe, Você, João, +2', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Trip' }
                  ].map((group, idx) => (
                    <div key={idx} className="flex items-center gap-3 py-1 cursor-pointer group">
                       <img src={group.avatar} className="w-10 h-10 rounded-full object-cover transition-transform group-active:scale-95" />
                       <div className="flex-1 border-b dark:border-white/5 pb-2 last:border-0">
                          <div className="text-[16px] text-wa-text font-medium">{group.name}</div>
                          <div className="text-[13px] text-wa-text-muted truncate">{group.members}</div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            {/* Block/Report buttons at bottom */}
            <div className="bg-white dark:bg-[#111b21] mb-8 shadow-sm">
               <div className="flex items-center gap-4 p-4 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer text-red-500 border-b border-wa-border dark:border-white/5"
                    onClick={() => handleDeleteContact(editingContact.id)}
               >
                  <Ban size={22} />
                  <span className="font-medium text-[16px]">Bloquear {editingContact.name}</span>
               </div>
               <div className="flex items-center gap-4 p-4 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer text-red-500 border-b border-wa-border dark:border-white/5"
                    onClick={() => handleDeleteContact(editingContact.id)}
               >
                  <Trash2 size={22} />
                  <span className="font-medium text-[16px]">Apagar contato</span>
               </div>
               <div className="flex items-center gap-4 p-4 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors cursor-pointer text-red-500">
                  <Flag size={22} />
                  <span className="font-medium text-[16px]">Denunciar {editingContact.name}</span>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contact Preview Popup */}
      <AnimatePresence>
        {previewContact && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/40 flex items-center justify-center p-6 backdrop-blur-[2px]"
            onClick={() => setPreviewContact(null)}
          >
            <motion.div 
              initial={{ scale: 0.8, y: -20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, y: -20 }}
              className="bg-wa-bg w-full max-w-[250px] rounded-lg overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div 
                className="relative aspect-square cursor-pointer overflow-hidden group"
                onClick={() => setFullScreenImage(previewContact.avatar || null)}
              >
                <img src={previewContact.avatar} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                   <Search size={40} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                </div>
                <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/60 to-transparent text-white font-medium">
                  {previewContact.name}
                </div>
              </div>
              <div className="flex justify-around items-center h-[50px] text-wa-green-dark">
                <button 
                  className="hover:bg-black/5 flex-1 h-full flex items-center justify-center transition-colors"
                  onClick={() => {
                    const existingChat = chats.find(c => c.contactId === previewContact.id);
                    if (existingChat) setActiveChatId(existingChat.id);
                    else handleAddChat(previewContact.id);
                    setPreviewContact(null);
                  }}
                >
                  <MessageSquare size={22} className="fill-wa-green-dark" />
                </button>
                <button className="hover:bg-black/5 flex-1 h-full flex items-center justify-center transition-colors">
                  <Phone size={22} className="fill-wa-green-dark" />
                </button>
                <button className="hover:bg-black/5 flex-1 h-full flex items-center justify-center transition-colors">
                  <Video size={22} className="fill-wa-green-dark" />
                </button>
                <button 
                  className="hover:bg-black/5 flex-1 h-full flex items-center justify-center transition-colors"
                  onClick={() => {
                    setEditingContact(previewContact);
                    setPreviewContact(null);
                  }}
                >
                  <Info size={22} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Screen Image Viewer */}
      <AnimatePresence>
        {fullScreenImage && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] bg-black flex flex-col items-center justify-center p-4"
            onClick={() => setFullScreenImage(null)}
          >
            <div className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-[510]">
               <button className="text-white p-2 hover:bg-white/10 rounded-full transition-colors">
                  <ArrowLeft size={24} />
               </button>
            </div>
            <motion.img 
              initial={{ scale: 0.8, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.8, opacity: 0 }}
              src={fullScreenImage} 
              alt="" 
              className="w-full max-h-[85vh] object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Simulation Call Overlay */}
      <AnimatePresence>
        {isCalling && (
          <motion.div
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 z-[1000] bg-[#0b141a] flex flex-col items-center justify-between p-12 py-20 text-white"
          >
             <div className="flex flex-col items-center gap-4">
                <div className="relative">
                   <motion.img 
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      src={isCalling.contact.avatar} 
                      className="w-32 h-32 rounded-full object-cover border-4 border-[#25d366]/20 shadow-2xl" 
                   />
                   <div className="absolute -bottom-2 -right-2 bg-[#25d366] rounded-full p-2 border-4 border-[#0b141a]">
                      {isCalling.type === 'voice' ? <Phone size={24} className="fill-current text-white" /> : <Video size={24} className="fill-current text-white" />}
                   </div>
                </div>
                <h2 className="text-3xl font-bold mt-4 tracking-tight">{isCalling.contact.name}</h2>
                <div className="flex items-center gap-2 text-[#25d366]">
                   <span className="text-lg font-medium animate-pulse">LIGANDO...</span>
                </div>
             </div>

             <div className="flex flex-col items-center gap-12 w-full max-w-xs">
                <div className="flex justify-between w-full opacity-60">
                   <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white">
                         <Clock size={24} />
                      </div>
                      <span className="text-xs font-medium uppercase tracking-[1px]">Lembrar</span>
                   </div>
                   <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white">
                         <MessageSquare size={24} />
                      </div>
                      <span className="text-xs font-medium uppercase tracking-[1px]">Mensagem</span>
                   </div>
                </div>

                <motion.button 
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setIsCalling(null)}
                  className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.5)] transition-transform text-white border-none outline-none"
                >
                   <Phone size={36} className="rotate-[135deg] fill-current" />
                </motion.button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* WhatsApp Style In-App Notification */}
      <AnimatePresence>
        {notification && (
          <WhatsAppNotification 
            contact={notification.contact} 
            message={notification.message} 
            onClose={() => setNotification(null)} 
          />
        )}
      </AnimatePresence>
      
      {/* Edit Status Modal */}
      <AnimatePresence>
        {editingStatusItem && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-[#202c33] w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-4 bg-wa-header dark:bg-[#111b21] flex items-center gap-4 border-b dark:border-white/5">
                 <button onClick={() => { setEditingStatusItem(null); setIsVideoPaused(false); }} className="text-wa-text">
                   <ArrowLeft size={24} />
                 </button>
                 <h2 className="text-xl font-bold text-wa-text">Editar Status</h2>
              </div>
              <div className="p-6 flex flex-col gap-5 overflow-y-auto max-h-[70vh]">
                 <div className="flex flex-col gap-2">
                    <label className="text-xs text-wa-green font-bold uppercase ml-1">Tipo de Status</label>
                    <div className="flex gap-2">
                       {Object.values(StatusType).map(type => (
                         <button
                           key={type}
                           onClick={() => setEditingStatusItem({ ...editingStatusItem, type: type as StatusType })}
                           className={cn(
                             "flex-1 py-2 px-3 rounded-lg text-xs font-bold uppercase transition-all border",
                             editingStatusItem.type === type 
                               ? "bg-wa-green text-white border-wa-green shadow-sm" 
                               : "bg-wa-bg dark:bg-[#2a3942] text-wa-text-muted border-black/5 dark:border-white/5 hover:bg-black/5 dark:hover:bg-white/5"
                           )}
                         >
                           {type === StatusType.TEXT ? 'Texto' : type === StatusType.IMAGE ? 'Foto' : 'Vídeo'}
                         </button>
                       ))}
                    </div>
                 </div>

                 {editingStatusItem.type === StatusType.TEXT ? (
                   <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-wa-green font-bold uppercase ml-1">Conteúdo do Status</label>
                      <textarea 
                         className="bg-wa-bg dark:bg-[#2a3942] border-b-2 border-wa-green p-3 outline-none text-wa-text text-[17px] min-h-[100px] resize-none focus:bg-black/5 dark:focus:bg-white/5 transition-colors"
                         value={editingStatusItem.content}
                         onChange={(e) => setEditingStatusItem({ ...editingStatusItem, content: e.target.value })}
                         placeholder="Escreva seu status..."
                      />
                   </div>
                 ) : (
                   <div className="flex flex-col gap-3">
                      <label className="text-xs text-wa-green font-bold uppercase ml-1">
                        {editingStatusItem.type === StatusType.IMAGE ? 'Imagem do Status' : 'Vídeo do Status'}
                      </label>
                      <div className="relative group aspect-video bg-wa-bg dark:bg-[#2a3942] rounded-xl overflow-hidden border-2 border-dashed border-wa-green/30 flex items-center justify-center cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-all" onClick={() => document.getElementById('edit-status-media-input')?.click()}>
                         {editingStatusItem.content ? (
                           editingStatusItem.type === StatusType.IMAGE ? (
                             <img src={editingStatusItem.content} className="w-full h-full object-contain" />
                           ) : (
                             <video src={editingStatusItem.content} className="w-full h-full object-contain" />
                           )
                         ) : (
                           <div className="flex flex-col items-center gap-2 text-wa-text-muted">
                              {editingStatusItem.type === StatusType.IMAGE ? <ImageIcon size={32} /> : <Video size={32} />}
                              <span className="text-xs font-medium">Clique para carregar mídia</span>
                           </div>
                         )}
                         <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Pencil size={24} className="text-white" />
                         </div>
                      </div>
                      <input 
                        id="edit-status-media-input"
                        type="file" 
                        className="hidden" 
                        accept={editingStatusItem.type === StatusType.IMAGE ? "image/*" : "video/*"}
                        onChange={(e) => handleImageUpload(e, (url) => setEditingStatusItem({ ...editingStatusItem, content: url }))}
                      />
                      <div className="flex flex-col gap-1">
                         <label className="text-[10px] text-wa-text-muted font-bold uppercase ml-1">Ou cole uma URL</label>
                         <input 
                           type="text"
                           className="bg-wa-bg dark:bg-[#2a3942] border-b border-wa-border p-2 outline-none text-wa-text text-sm"
                           value={editingStatusItem.content.startsWith('data:') ? '' : editingStatusItem.content}
                           onChange={(e) => setEditingStatusItem({ ...editingStatusItem, content: e.target.value })}
                           placeholder="https://exemplo.com/media.jpg"
                         />
                      </div>
                   </div>
                 )}

                 {editingStatusItem.type === StatusType.TEXT && (
                   <div className="flex flex-col gap-2">
                     <label className="text-xs text-wa-green font-bold uppercase ml-1">Cor de Fundo</label>
                     <div className="flex gap-2">
                        {['#25D366', '#000000', '#FF3B30', '#007AFF', '#5856D6', '#FF9500'].map(color => (
                          <div 
                            key={color} 
                            onClick={() => setEditingStatusItem({ ...editingStatusItem, backgroundColor: color })}
                            className={cn(
                              "w-8 h-8 rounded-full cursor-pointer border-2",
                              editingStatusItem.backgroundColor === color ? "border-white" : "border-transparent"
                            )}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                     </div>
                   </div>
                 )}

                 <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-wa-green font-bold uppercase ml-1">Autor do Status</label>
                    <div className="flex gap-2 p-1 bg-wa-bg dark:bg-[#2a3942] rounded-xl">
                       <button 
                         onClick={() => setEditingStatusItem({ ...editingStatusItem, creatorId: 'me' })}
                         className={cn(
                           "flex-1 py-2 px-3 rounded-lg text-xs font-bold uppercase transition-all",
                           editingStatusItem.creatorId === 'me' 
                             ? "bg-white dark:bg-[#3b4a54] text-wa-green shadow-sm" 
                             : "text-wa-text-muted hover:bg-black/5 dark:hover:bg-white/5"
                         )}
                       >
                         Meu Status
                       </button>
                       <select 
                         className="flex-1 bg-transparent border-none outline-none text-xs font-bold uppercase text-wa-text-muted px-2"
                         value={editingStatusItem.creatorId === 'me' ? '' : editingStatusItem.creatorId}
                         onChange={(e) => {
                            if (e.target.value) {
                              setEditingStatusItem({ ...editingStatusItem, creatorId: e.target.value });
                            }
                         }}
                       >
                         <option value="" disabled>{editingStatusItem.creatorId === 'me' ? 'Mudar Autor' : 'Contatos'}</option>
                         {contacts.map(c => (
                           <option key={c.id} value={c.id}>{c.name}</option>
                         ))}
                       </select>
                    </div>
                 </div>

                 <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-wa-green font-bold uppercase ml-1">Visualizações (Simuladas)</label>
                    <input 
                       type="number"
                       className="bg-wa-bg dark:bg-[#2a3942] border-b-2 border-wa-green p-3 outline-none text-wa-text text-[17px]"
                       value={editingStatusItem.viewers?.length || 0}
                       onChange={(e) => {
                          const count = parseInt(e.target.value);
                          const newViewers = Array.from({ length: count }, (_, i) => `viewer-${i}`);
                          setEditingStatusItem({ ...editingStatusItem, viewers: newViewers });
                       }}
                    />
                 </div>
              </div>
              <div className="p-4 bg-wa-bg dark:bg-[#111b21] flex justify-end gap-3">
                 <button 
                   onClick={() => { setEditingStatusItem(null); setIsVideoPaused(false); }}
                   className="px-6 py-2 rounded-full font-bold text-wa-green uppercase text-sm tracking-wider"
                 >
                   Cancelar
                 </button>
                 <button 
                   onClick={() => {
                      setStatuses(prev => prev.map(s => s.id === editingStatusItem.id ? editingStatusItem : s));
                      // Also update the viewingStatus state if active
                      if (viewingStatus) {
                        setViewingStatus(prev => prev ? prev.map(s => s.id === editingStatusItem.id ? editingStatusItem : s) : null);
                      }
                      setEditingStatusItem(null);
                      setIsVideoPaused(false);
                   }}
                   className="px-6 py-2 bg-wa-green text-white rounded-full font-bold shadow-md uppercase text-sm tracking-wider"
                 >
                   Salvar
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <audio ref={notificationSoundRef} src="https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3" className="hidden" />
    </div>
  );
}

// Components
function WhatsAppNotification({ contact, message, onClose }: { contact: Contact, message: string, onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 20, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 150 }}
      className="fixed top-0 left-0 right-0 z-[1000] px-4 flex justify-center pointer-events-none"
    >
      <div 
        className="bg-[#1c1c1e] dark:bg-[#2c2c2e] text-white w-full max-w-sm rounded-[24px] shadow-[0_15px_50px_rgba(0,0,0,0.4)] p-3 pl-4 flex items-center gap-3 border border-white/10 pointer-events-auto backdrop-blur-3xl cursor-pointer active:scale-95 transition-transform"
        onClick={onClose}
      >
        <div className="relative shrink-0">
          <img src={contact.avatar} className="w-12 h-12 rounded-full object-cover shadow-sm bg-wa-bg-dark" alt="" />
          <div className="absolute -bottom-1 -right-1 bg-[#25d366] rounded-full p-1 border-2 border-[#1c1c1e] dark:border-[#2c2c2e]">
            <MessageSquare size={10} className="text-black fill-black" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center mb-0.5">
            <span className="font-bold text-[15px] truncate text-white/95">{contact.name}</span>
            <span className="text-[11px] text-white/30 font-medium tracking-tight">agora</span>
          </div>
          <p className="text-[14px] text-white/70 truncate leading-snug font-normal">{message}</p>
        </div>
        <div className="shrink-0 flex items-center justify-center p-1">
           <div className="w-1 h-1 bg-white/20 rounded-full" />
        </div>
      </div>
    </motion.div>
  );
}

function Modal({ title, children, onClose }: { title: string, children: ReactNode, onClose: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="bg-wa-bg w-full max-w-md rounded-xl overflow-hidden shadow-2xl border border-wa-border"
      >
        <div className="p-4 bg-wa-header border-b border-wa-border text-wa-text font-bold flex justify-between items-center">
          <span className="text-lg">{title}</span>
          <button onClick={onClose} className="p-1 hover:bg-black/5 rounded-full outline-none transition-colors">
            <Plus size={24} className="rotate-45 text-wa-text-secondary" />
          </button>
        </div>
        <div className="bg-wa-bg p-4">
          {children}
        </div>
      </motion.div>
    </motion.div>
  );
}

function ChatScreen({ 
  theme, 
  chat, 
  contact, 
  messages, 
  isTyping, 
  onBack, 
  onSendMessage, 
  onSendFakeResponse, 
  setEditingContact,
  myProfile,
  // Novas props
  handleReact,
  handleForward,
  forwardingMessage,
  setForwardingMessage,
  messageContextMenu,
  setMessageContextMenu,
  contacts,
  chats,
  setChats,
  setMessages,
  onCall
}: { 
  theme: 'light' | 'dark',
  chat: Chat, 
  contact: Contact, 
  messages: Message[], 
  isTyping: boolean,
  onBack: () => void,
  onSendMessage: (c: string, t: MessageType, s?: string) => void,
  onSendFakeResponse: (c: string, t: MessageType) => void,
  setEditingContact: (c: Contact | null) => void,
  myProfile: { name: string, avatar: string },
  handleReact: (id: string, e: string) => void,
  handleForward: (id: string) => void,
  forwardingMessage: Message | null,
  setForwardingMessage: (m: Message | null) => void,
  messageContextMenu: { messageId: string, x: number, y: number, isMe: boolean } | null,
  setMessageContextMenu: (v: { messageId: string, x: number, y: number, isMe: boolean } | null) => void,
  contacts: Contact[],
  chats: Chat[],
  setChats: React.Dispatch<React.SetStateAction<Chat[]>>,
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  onCall: (type: 'voice' | 'video') => void
}) {
  const [text, setText] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [senderId, setSenderId] = useState<'me' | string>('me');
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setText(prev => prev + emojiData.emoji);
  };
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const startRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert("Seu navegador não suporta gravação de áudio.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === 'string') {
              onSendMessage(reader.result, MessageType.AUDIO, senderId);
            }
          };
          reader.onerror = (err) => {
            console.error("FileReader (audio) error:", err);
          };
          reader.readAsDataURL(audioBlob);
        } catch (e) {
          console.error("Failed to process audio recording", e);
        }
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Erro ao acessar microfone:", err);
      alert("Erro ao acessar microfone. Verifique as permissões.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const playAudio = (id: string, content: string) => {
    if (playingAudioId === id) {
      audioPlayerRef.current?.pause();
      setPlayingAudioId(null);
    } else {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current.src = content;
        setPlayingAudioId(id);
        
        audioPlayerRef.current.play().catch(err => {
          // Suppress AbortError which occurs when a new load() request interrupts play()
          if (err.name !== 'AbortError') {
             console.error("Error playing audio:", err);
             setPlayingAudioId(current => current === id ? null : current);
          }
        });

        audioPlayerRef.current.onended = () => setPlayingAudioId(null);
        audioPlayerRef.current.onerror = () => {
          setPlayingAudioId(null);
          console.error("Erro ao reproduzir áudio");
        };
      }
    }
  };

  useEffect(() => {
    return () => {
      audioPlayerRef.current?.pause();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#efeae2] dark:bg-[#0b141a]">
      <audio ref={audioPlayerRef} className="hidden" />
      {/* Chat Header */}
      <div className="bg-wa-header dark:bg-[#111b21] p-2 flex items-center gap-2 px-2 h-[64px] sticky top-0 z-30 transition-colors border-b border-wa-border dark:border-white/5">
        <div className="flex items-center gap-0.5 group cursor-pointer" onClick={onBack}>
          <div className="p-1 group-hover:bg-black/5 dark:group-hover:bg-white/5 rounded-full">
            <ArrowLeft size={20} className="text-wa-text" />
          </div>
          <img src={contact.avatar} alt="" className="w-10 h-10 rounded-full border border-black/5 object-cover flex-shrink-0" />
        </div>
        <div className="flex-1 flex flex-col min-w-0 ml-1 cursor-pointer" onClick={() => setEditingContact(contact)}>
          <span className="text-[17px] font-bold text-wa-text truncate leading-tight">{contact.name}</span>
          <span className="text-[12px] text-wa-text-muted truncate">
            {isTyping ? <span className="text-[#25d366] font-medium">digitando...</span> : (contact.status || 'visto por último hoje às 15:42')}
          </span>
        </div>
        <div className="flex gap-1 text-wa-text-secondary mr-1 items-center">
           <button 
             onClick={() => onCall('video')}
             className="p-2.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
           >
              <Video size={20} className="text-wa-text" />
           </button>
           <button 
             onClick={() => onCall('voice')}
             className="p-2.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
           >
              <Phone size={20} className="text-wa-text" />
           </button>
           <button 
             onClick={() => setEditingContact(contact)}
             className="p-2.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
           >
              <MoreVertical size={20} className="text-wa-text" />
           </button>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 py-2 space-y-1 relative bg-[#efeae2] dark:bg-[#0b141a] scroll-smooth no-scrollbar">
        <div 
          className="absolute inset-0 opacity-[0.06] dark:opacity-[0.04] bg-repeat bg-[length:412px] pointer-events-none"
          style={{ 
            backgroundImage: 'url(https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png)',
            filter: theme === 'dark' ? 'invert(1) brightness(0.8)' : 'none'
          }}
        />
        <div className="relative z-10 space-y-1.5 flex flex-col">
          {messages.map((m, index) => {
            const prevMessage = index > 0 ? messages[index - 1] : null;
            const showDateBubble = !prevMessage || !isSameDay(m.timestamp, prevMessage.timestamp);
            const isMe = m.senderId === 'me';
            
            return (
              <React.Fragment key={m.id}>
                {showDateBubble && (
                  <div className="flex justify-center my-5 w-full animate-in fade-in zoom-in-95 duration-500">
                    <div className="bg-white/90 dark:bg-[#182229] dark:text-[#8696a0] text-[#54656f] text-[11px] px-4 py-1.5 rounded-xl shadow-sm border border-black/5 dark:border-none uppercase font-bold tracking-widest backdrop-blur-md">
                      {isToday(m.timestamp) ? 'Hoje' : isYesterday(m.timestamp) ? 'Ontem' : format(m.timestamp, 'dd/MM/yyyy')}
                    </div>
                  </div>
                )}
                {m.type === MessageType.SYSTEM ? (
                <div className="flex justify-center my-4 w-full">
                  <div className="bg-[#fff9c2]/90 dark:bg-[#182229]/60 dark:text-[#aebac1] text-[#54656f] text-[11.5px] px-4 py-2 rounded-xl shadow-sm border border-[#e1d9b1]/60 dark:border-none max-w-[90%] text-center flex items-center justify-center gap-2 leading-relaxed font-medium">
                    <Info size={13} className="shrink-0 opacity-70" />
                    <span>{m.content}</span>
                  </div>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className={cn(
                    "max-w-[85%] px-2.5 py-1.5 rounded-xl relative text-[15px] shadow-[0_1px_0.5px_rgba(0,0,0,0.13)] group/msg select-none",
                    isMe 
                      ? "bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef] ml-auto rounded-tr-none" 
                      : "bg-[#ffffff] dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] mr-auto rounded-tl-none"
                  )}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setMessageContextMenu({ messageId: m.id, x: e.clientX, y: e.clientY, isMe });
                  }}
                  onClick={() => {
                    if (m.type === MessageType.AUDIO) playAudio(m.id, m.content);
                  }}
                >
                  <button 
                    onClick={(e) => {
                       e.stopPropagation();
                       const rect = e.currentTarget.getBoundingClientRect();
                       setMessageContextMenu({ messageId: m.id, x: rect.left, y: rect.top + 20, isMe });
                    }}
                    className="absolute top-1 right-2 opacity-0 group-hover/msg:opacity-100 transition-opacity p-0.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-wa-text-muted z-10"
                  >
                    <MoreVertical size={18} />
                  </button>
                  {isMe && (
                     <div className="absolute top-0 -right-2 w-0 h-0 border-t-[10px] border-t-[#d9fdd3] dark:border-t-[#005c4b] border-r-[10px] border-r-transparent" />
                  )}
                  {!isMe && (
                     <div className="absolute top-0 -left-2 w-0 h-0 border-t-[10px] border-t-white dark:border-t-[#202c33] border-l-[10px] border-l-transparent" />
                  )}

                  {m.isForwarded && (
                    <div className="flex items-center gap-1 text-wa-text-muted/60 dark:text-[#aebac1]/50 text-[11px] italic mb-1">
                      <Forward size={12} className="transform scale-x-[-1]" />
                      <span>Encaminhada</span>
                    </div>
                  )}

                  {m.type === MessageType.TEXT && <p className="whitespace-pre-wrap leading-normal">{m.content}</p>}
                  {m.type === MessageType.IMAGE && (
                    <div className="flex flex-col gap-1.5 -mx-1 -mt-0.5">
                      <img src={m.content} alt="" className="rounded-lg max-h-72 w-full object-cover shadow-sm cursor-pointer active:scale-[0.99] transition-transform" />
                      {m.content.includes('data:') && <span className="text-[10px] text-wa-text-muted px-1.5">📷 Foto</span>}
                    </div>
                  )}
                  {m.type === MessageType.VIDEO && (
                    <div className="flex flex-col gap-1.5 -mx-1 -mt-0.5">
                      <video src={m.content} controls className="rounded-lg max-h-72 w-full object-cover shadow-sm" />
                      {m.content.includes('data:') && <span className="text-[10px] text-wa-text-muted px-1.5">🎥 Vídeo</span>}
                    </div>
                  )}
                  {m.type === MessageType.AUDIO && (
                     <div className="flex items-center gap-3 min-w-[240px] p-1 py-1.5">
                        <div 
                          onClick={() => playAudio(m.id, m.content)}
                          className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center cursor-pointer transition-all shadow-sm",
                            isMe ? "bg-[#efeae2] dark:bg-[#111b21]" : "bg-[#f0f2f5] dark:bg-[#2a3942]"
                          )}
                        >
                          {playingAudioId === m.id ? (
                             <div className="flex gap-0.5 items-end h-4">
                                {[1,2,3,4].map(i => (
                                  <div key={i} className="w-1 bg-[#25d366] animate-pulse" style={{ height: `${20 + Math.random() * 80}%`, animationDelay: `${i*0.1}s` }} />
                                ))}
                             </div>
                          ) : (
                             <div className="relative">
                               <Play size={20} className={cn("fill-current", isMe ? "text-[#008069] dark:text-[#25d366]" : "text-wa-text-muted")} />
                             </div>
                          )}
                        </div>
                        <div className="flex-1 space-y-1">
                           <div className="flex items-center gap-1.5 h-6">
                              {[...Array(18)].map((_, i) => (
                                <div key={i} className={cn("w-0.5 rounded-full flex-1", i < 6 ? "bg-wa-green/60 h-2" : "bg-gray-300 dark:bg-gray-600 h-1.5")} />
                              ))}
                           </div>
                           <div className="flex justify-between items-center pr-1">
                             <span className="text-[10px] text-wa-text-muted">0:12</span>
                             <span className="text-[10px] text-wa-text-muted font-medium">{format(m.timestamp, 'HH:mm')}</span>
                           </div>
                        </div>
                        <div className="relative shrink-0">
                           <img src={isMe ? myProfile.avatar : contact.avatar} className="w-7 h-7 rounded-full border border-black/5 object-cover" />
                           <Mic size={12} className="absolute -bottom-1 -right-1 text-[#25d366] fill-[#25d366] bg-white dark:bg-black rounded-full" />
                        </div>
                     </div>
                  )}
                  {m.type !== MessageType.AUDIO && (
                    <div className="flex justify-end gap-1 items-center mt-1">
                      <span className="text-[11px] text-wa-text-muted/80 dark:text-[#aebac1]/60 font-medium">{format(m.timestamp, 'HH:mm')}</span>
                      {isMe && (
                        <div className="flex -space-x-1.5 ml-1">
                           <CheckCheck size={16} className={cn(m.isRead ? "text-[#53bdeb]" : "text-wa-text-muted/60")} />
                        </div>
                      )}
                    </div>
                  )}
                  
                  {m.reactions && m.reactions.length > 0 && (
                    <div className={cn(
                      "absolute -bottom-3 flex gap-0.5 bg-white dark:bg-[#202c33] p-0.5 px-2 rounded-full shadow-md border border-black/5 dark:border-white/5 z-20 transition-all cursor-default scale-110",
                      isMe ? "right-2" : "left-2"
                    )}>
                      {Array.from(new Set(m.reactions)).map((r, i) => (
                        <span key={i} className="text-[12px]">{r}</span>
                      ))}
                      {m.reactions.length > 1 && <span className="text-[10px] ml-0.5 text-wa-text-muted dark:text-[#aebac1] self-center font-bold">{m.reactions.length}</span>}
                    </div>
                  )}
                </motion.div>
              )}
            </React.Fragment>
        );
      })}
    </div>
  </div>

      {/* Input Area */}
      <footer className="bg-wa-header dark:bg-[#111b21] px-4 py-2.5 flex items-center gap-4 border-t border-wa-border dark:border-white/5 relative">
        {isRecording && (
          <div className="absolute inset-0 bg-wa-header dark:bg-[#111b21] z-10 flex items-center px-4 gap-4 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex-1 flex items-center gap-3">
              <Mic size={24} className="text-red-500 animate-pulse" />
              <span className="text-wa-text font-medium">{formatTime(recordingTime)}</span>
              <span className="text-sm text-wa-text-muted ml-4">Gravando áudio...</span>
            </div>
            <button 
              onClick={stopRecording}
              className="text-wa-green font-bold text-sm uppercase tracking-wider"
            >
              Parar
            </button>
          </div>
        )}
        
        <div className="flex items-center gap-1 text-wa-text-secondary relative">
          <button
            onClick={() => setSenderId(prev => prev === 'me' ? contact.id : 'me')}
            className="p-1 h-9 w-9 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center justify-center relative group shrink-0"
            title={senderId === 'me' ? "Enviar como eu" : `Enviar como ${contact.name}`}
          >
            <img 
              src={senderId === 'me' ? myProfile.avatar : contact.avatar} 
              className="w-6 h-6 rounded-full object-cover border border-wa-border"
              alt=""
            />
            <div className="absolute -bottom-1 -right-1 bg-wa-green rounded-full p-0.5 border-2 border-wa-header dark:border-[#111b21]">
              <div className="w-2 h-2 bg-black rounded-full" />
            </div>
          </button>
          
          {showEmojiPicker ? (
            <Keyboard 
              size={24} 
              className="cursor-pointer p-1 h-9 w-9 rounded-full bg-wa-green/20 text-wa-green transition-colors"
              onClick={() => setShowEmojiPicker(false)}
            />
          ) : (
            <Smile 
              size={24} 
              className="cursor-pointer p-1 h-9 w-9 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              onClick={() => setShowEmojiPicker(true)}
            />
          )}
          {showEmojiPicker && (
            <div className="absolute bottom-14 left-0 z-50 shadow-2xl rounded-lg overflow-hidden border border-wa-border-light dark:border-white/10">
              <EmojiPicker 
                theme={theme === 'dark' ? EmojiTheme.DARK : EmojiTheme.LIGHT}
                onEmojiClick={onEmojiClick}
                autoFocusSearch={false}
                searchPlaceholder="Procurar emoji"
                previewConfig={{ showPreview: false }}
                skinTonesDisabled
                width={340}
                height={420}
                emojiStyle={"apple" as any}
              />
            </div>
          )}
        </div>
        {/* Editing Message Indicator */}
        {editingMessageId && (
          <div className="bg-white dark:bg-[#111b21] px-4 py-2 flex items-center justify-between border-t border-wa-border dark:border-white/5 animate-in slide-in-from-bottom-2 duration-200">
             <div className="flex items-center gap-3">
                <div className="p-2 border-l-4 border-wa-green bg-wa-bg dark:bg-white/5 rounded-r-md">
                   <p className="text-xs text-wa-green font-bold">Editando Mensagem</p>
                   <p className="text-sm text-wa-text-muted truncate max-w-[250px]">
                      {messages.find(m => m.id === editingMessageId)?.content}
                   </p>
                </div>
             </div>
             <button 
               onClick={() => {
                 setEditingMessageId(null);
                 setText('');
               }}
               className="p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-full"
             >
               <X size={20} className="text-wa-text-muted" />
             </button>
          </div>
        )}

        <div className="flex-1 bg-wa-bg dark:bg-[#2a3942] rounded-[24px] px-4 py-2 shadow-sm border border-transparent focus-within:border-wa-green transition-all flex items-center gap-2">
          <input 
            type="text" 
            placeholder="Mensagem"
            className="flex-1 bg-transparent outline-none text-[15px] placeholder:text-wa-text-muted text-wa-text py-1"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && text.trim()) {
                if (editingMessageId) {
                  setMessages(prev => prev.map(m => {
                    if (m.id === editingMessageId) {
                      const updated = { ...m, content: text };
                      setChats(prevChats => prevChats.map(c => 
                        (c.lastMessage && c.lastMessage.id === editingMessageId) ? { ...c, lastMessage: updated } : c
                      ));
                      return updated;
                    }
                    return m;
                  }));
                  setEditingMessageId(null);
                } else {
                  onSendMessage(text, MessageType.TEXT, senderId);
                }
                setText('');
                setShowEmojiPicker(false);
              }
            }}
          />
          <label className="text-wa-text-muted cursor-pointer hover:text-wa-text-secondary transition-colors">
            <Paperclip size={20} />
            <input 
              type="file" 
              className="hidden" 
              accept="*/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => {
                    if (typeof reader.result === 'string') {
                      let type = MessageType.TEXT;
                      if (file.type.startsWith('image/')) type = MessageType.IMAGE;
                      else if (file.type.startsWith('video/')) type = MessageType.VIDEO;
                      else if (file.type.startsWith('audio/')) type = MessageType.AUDIO;
                      onSendMessage(reader.result, type, senderId);
                    }
                  };
                  reader.readAsDataURL(file);
                }
              }}
            />
          </label>
          {!text.trim() && (
            <label className="text-wa-text-muted cursor-pointer hover:text-wa-text-secondary transition-colors">
              <Camera size={20} />
              <input 
                type="file" 
                className="hidden" 
                accept="image/*,video/*"
                capture="environment"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      if (typeof reader.result === 'string') {
                        const type = file.type.startsWith('image/') ? MessageType.IMAGE : MessageType.VIDEO;
                        onSendMessage(reader.result, type, senderId);
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </label>
          )}
        </div>
        <div className="flex items-center justify-center w-12 h-12">
          {!text.trim() ? (
            <button 
              onMouseDown={startRecording}
              onMouseUp={stopRecording}
              onMouseLeave={stopRecording}
              className={cn(
                "w-12 h-12 bg-wa-green rounded-full flex items-center justify-center text-[#0b141a] shadow-md transition-all duration-200",
                isRecording ? "scale-110 !bg-red-500 !text-white" : "hover:scale-105 active:scale-95"
              )}
            >
              <Mic size={22} className={cn(!isRecording && "fill-[#0b141a]")} />
            </button>
              ) : (
                <button 
                  onClick={() => {
                    if (editingMessageId) {
                      setMessages(prev => prev.map(m => {
                        if (m.id === editingMessageId) {
                          const updated = { ...m, content: text };
                          setChats(prevChats => prevChats.map(c => 
                            (c.lastMessage && c.lastMessage.id === editingMessageId) ? { ...c, lastMessage: updated } : c
                          ));
                          return updated;
                        }
                        return m;
                      }));
                      setEditingMessageId(null);
                    } else {
                      onSendMessage(text, MessageType.TEXT, senderId);
                    }
                    setText('');
                    setShowEmojiPicker(false);
                  }}
                  className="w-12 h-12 bg-wa-green rounded-full flex items-center justify-center text-[#0b141a] shadow-md hover:scale-105 active:scale-95 transition-all"
                >
                  <Send size={22} className="fill-[#0b141a] ml-1" />
                </button>
              )}
        </div>
      </footer>

      {/* Message Context Menu / Reaction Tray */}
      <AnimatePresence>
        {messageContextMenu && (
          <>
            <div className="fixed inset-0 z-[100] backdrop-blur-[1px] bg-black/10 transition-all dark:bg-black/40" onClick={() => setMessageContextMenu(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              style={{ 
                top: Math.max(20, Math.min(messageContextMenu.y - 140, typeof window !== 'undefined' ? window.innerHeight - 320 : 0)), 
                left: Math.max(10, Math.min(messageContextMenu.x - 90, typeof window !== 'undefined' ? window.innerWidth - 220 : 0)) 
              }}
              className="fixed z-[101] flex flex-col gap-2"
            >
              {/* Reactions Tray */}
              <div className="bg-white dark:bg-[#233138] shadow-2xl rounded-full py-1.5 px-2 border dark:border-white/10 flex justify-between gap-1 min-w-[240px]">
                {['❤️', '👍', '😂', '😮', '😢', '🙏'].map((emoji, idx) => (
                  <motion.button 
                    key={emoji}
                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: idx * 0.03, type: 'spring' }}
                    className="hover:bg-gray-200 dark:hover:bg-white/10 p-2 rounded-full transition-all transform hover:scale-150 active:scale-95 text-xl"
                    onClick={() => handleReact(messageContextMenu.messageId, emoji)}
                  >
                    {emoji}
                  </motion.button>
                ))}
                <button className="hover:bg-gray-200 dark:hover:bg-white/10 p-2 rounded-full transition-colors text-wa-text-muted">
                    <Plus size={20} />
                </button>
              </div>

              {/* Context Menu Actions */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-[#233138] shadow-2xl rounded-2xl py-1 border dark:border-white/10 min-w-[200px] overflow-hidden self-start"
                style={{ marginLeft: messageContextMenu.isMe ? 'auto' : '0' }}
              >
                {messageContextMenu.isMe && (
                  <button 
                    className="w-full text-left px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-between text-sm text-wa-text"
                    onClick={() => {
                      const m = messages.find(msg => msg.id === messageContextMenu.messageId);
                      if (m && m.type === MessageType.TEXT) {
                        setText(m.content);
                        setEditingMessageId(m.id);
                      }
                      setMessageContextMenu(null);
                    }}
                  >
                    <span>Editar</span>
                    <Pencil size={16} className="text-wa-text-muted opacity-60" />
                  </button>
                )}
                <button 
                  className="w-full text-left px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-between text-sm text-wa-text"
                  onClick={() => {
                    const m = messages.find(msg => msg.id === messageContextMenu.messageId);
                    if (m) setForwardingMessage(m);
                    setMessageContextMenu(null);
                  }}
                >
                  <span>Encaminhar</span>
                  <Forward size={16} className="text-wa-text-muted opacity-60" />
                </button>
                <button 
                  className="w-full text-left px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-between text-sm text-wa-text"
                  onClick={() => {
                    const m = messages.find(msg => msg.id === messageContextMenu.messageId);
                    if (m) navigator.clipboard.writeText(m.content);
                    setMessageContextMenu(null);
                  }}
                >
                   <span>Copiar</span>
                   <Paperclip size={16} className="text-wa-text-muted opacity-60" />
                </button>
                <div className="h-[1px] bg-black/5 dark:bg-white/5 mx-2 my-1" />
                <button 
                  className="w-full text-left px-4 py-3 hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-between text-sm text-red-500 font-medium"
                  onClick={() => {
                    if (confirm('Deseja realmente apagar esta mensagem?')) {
                      setMessages(prev => prev.filter(m => m.id !== messageContextMenu.messageId));
                      setMessageContextMenu(null);
                    }
                  }}
                >
                  <span>Apagar</span>
                  <Trash2 size={16} />
                </button>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Forwarding Modal */}
      <AnimatePresence>
        {forwardingMessage && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setForwardingMessage(null)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm bg-wa-header dark:bg-[#233138] rounded-2xl shadow-2xl overflow-hidden border border-wa-border-light flex flex-col max-h-[80vh]"
            >
              <div className="p-4 border-b border-wa-border-light flex items-center gap-4">
                <button onClick={() => setForwardingMessage(null)}>
                  <Plus className="rotate-45 text-wa-text-muted" />
                </button>
                <h3 className="text-lg font-bold">Encaminhar para...</h3>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar">
                <div className="p-4 space-y-4">
                  <div className="text-xs font-bold text-wa-green uppercase tracking-wider mb-2 font-mono">Contatos Recentes</div>
                  {contacts.map(contact => (
                    <div 
                      key={contact.id}
                      className="flex items-center gap-4 p-2 hover:bg-wa-bg rounded-lg cursor-pointer transition-colors group"
                      onClick={() => {
                        let chat = chats.find(c => c.contactId === contact.id);
                        if (chat) {
                          handleForward(chat.id);
                        } else {
                          const id = Math.random().toString(36).substring(2, 11);
                          setChats(prev => [{ id, contactId: contact.id }, ...prev]);
                          handleForward(id);
                        }
                      }}
                    >
                      <img src={contact.avatar} alt="" className="w-10 h-10 rounded-full border border-wa-border-light" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-wa-text truncate">{contact.name}</div>
                        <div className="text-xs text-wa-text-muted truncate">{contact.status || 'Ativo'}</div>
                      </div>
                      <button className="text-wa-green text-xs font-extra-bold uppercase p-2 hover:bg-wa-green/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                        Enviar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
