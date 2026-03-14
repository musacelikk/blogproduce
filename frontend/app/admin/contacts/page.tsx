'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  MailOpen,
  Clock,
  User,
  MessageSquare,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  getAdminContacts,
  markContactAsRead,
  markContactAsUnread,
  getAdminContactUnreadCount,
  type Contact,
} from '@/lib/api';

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  useEffect(() => {
    loadContacts();
    loadUnreadCount();
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminContacts();
      setContacts(data);
    } catch (err) {
      console.error('Error loading contacts:', err);
      setError(err instanceof Error ? err.message : 'Mesajlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const count = await getAdminContactUnreadCount();
      setUnreadCount(count);
    } catch (err) {
      console.error('Error loading unread count:', err);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await markContactAsRead(id);
      await loadContacts();
      await loadUnreadCount();
      if (selectedContact?.id === id) {
        setSelectedContact({ ...selectedContact, isRead: true });
      }
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const handleMarkAsUnread = async (id: string) => {
    try {
      await markContactAsUnread(id);
      await loadContacts();
      await loadUnreadCount();
      if (selectedContact?.id === id) {
        setSelectedContact({ ...selectedContact, isRead: false });
      }
    } catch (err) {
      console.error('Error marking as unread:', err);
    }
  };

  const handleContactClick = (contact: Contact) => {
    setSelectedContact(contact);
    if (!contact.isRead) {
      handleMarkAsRead(contact.id);
    }
  };

  const filteredContacts =
    filter === 'all'
      ? contacts
      : filter === 'unread'
      ? contacts.filter((c) => !c.isRead)
      : contacts.filter((c) => c.isRead);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 0) return `${days} gün önce`;
    if (hours > 0) return `${hours} saat önce`;
    if (minutes > 0) return `${minutes} dakika önce`;
    return 'Az önce';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-[#3B82F6]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1
            className="text-lg md:text-xl lg:text-2xl font-normal mb-4 text-foreground text-[#ebebeb]"
            style={{
              color: '#ebebeb',
              fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
            }}
          >
            Mesajlar
          </h1>
          <p
            className="text-[#ebebeb]"
            style={{
              fontFamily: 'var(--font-sans), "Inter", sans-serif',
            }}
          >
            Bize ulaşın formundan gelen mesajları görüntüleyin ve yönetin
          </p>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg transition-all ${
              filter === 'all'
                ? 'bg-[#3B82F6] text-white'
                : 'bg-card border border-white/20 text-[#ebebeb]/50 hover:bg-accent'
            }`}
            style={{
              fontFamily: 'var(--font-sans), "Inter", sans-serif',
            }}
          >
            Tümü ({contacts.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${
              filter === 'unread'
                ? 'bg-[#3B82F6] text-white'
                : 'bg-card border border-border text-[#ebebeb] hover:bg-accent'
            }`}
            style={{
              fontFamily: 'var(--font-sans), "Inter", sans-serif',
            }}
          >
            <Mail className="w-4 h-4" />
            Okunmamış ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`px-4 py-2 rounded-lg transition-all ${
              filter === 'read'
                ? 'bg-[#3B82F6] text-white'
                : 'bg-card border border-border text-[#ebebeb] hover:bg-accent'
            }`}
            style={{
              fontFamily: 'var(--font-sans), "Inter", sans-serif',
            }}
          >
            Okundu ({contacts.length - unreadCount})
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Contact List */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                {filteredContacts.length === 0 ? (
                  <div className="p-8 text-center text-[#ebebeb]">
                    <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Henüz mesaj yok</p>
                  </div>
                ) : (
                  filteredContacts.map((contact) => (
                    <motion.div
                      key={contact.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => handleContactClick(contact)}
                      className={`p-4 border-b border-border cursor-pointer transition-all ${
                        selectedContact?.id === contact.id
                          ? 'bg-[#3B82F6]/10 border-l-4 border-l-[#3B82F6]'
                          : 'hover:bg-accent'
                      } ${!contact.isRead ? 'bg-blue-50/5' : ''}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {!contact.isRead && (
                              <div className="w-2 h-2 bg-[#3B82F6] rounded-full flex-shrink-0"></div>
                            )}
                            <h3
                              className={`font-semibold truncate ${
                                !contact.isRead ? 'text-[#ebebeb]' : 'text-[#ebebeb]/70'
                              }`}
                              style={{
                                fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
                              }}
                            >
                              {contact.name}
                            </h3>
                          </div>
                          <p
                            className="text-sm truncate text-[#ebebeb]/80"
                            style={{
                              fontFamily: 'var(--font-sans), "Inter", sans-serif',
                            }}
                          >
                            {contact.subject}
                          </p>
                        </div>
                        {contact.isRead ? (
                          <MailOpen className="w-4 h-4 text-muted-foreground flex-shrink-0 ml-2" />
                        ) : (
                          <Mail className="w-4 h-4 text-[#3B82F6] flex-shrink-0 ml-2" />
                        )}
                      </div>
                      <div className="flex items-center justify-between text-xs text-[#ebebeb]/70">
                        <span
                          style={{
                            fontFamily: 'var(--font-sans), "Inter", sans-serif',
                          }}
                        >
                          {formatDate(contact.createdAt)}
                        </span>
                        <a
                          href={`mailto:${contact.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="hover:text-[#3B82F6] transition-colors"
                        >
                          {contact.email}
                        </a>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Contact Detail */}
          <div className="lg:col-span-2">
            {selectedContact ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-2xl p-6 md:p-8"
              >
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2
                      className="text-2xl md:text-3xl font-normal mb-2 text-[#ebebeb]"
                      style={{
                        fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
                      }}
                    >
                      {selectedContact.subject}
                    </h2>
                    <div className="flex items-center gap-4 text-sm text-[#ebebeb]/80">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span
                          style={{
                            fontFamily: 'var(--font-sans), "Inter", sans-serif',
                          }}
                        >
                          {selectedContact.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        <a
                          href={`mailto:${selectedContact.email}`}
                          className="hover:text-[#3B82F6] transition-colors"
                          style={{
                            fontFamily: 'var(--font-sans), "Inter", sans-serif',
                          }}
                        >
                          {selectedContact.email}
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span
                          style={{
                            fontFamily: 'var(--font-sans), "Inter", sans-serif',
                          }}
                        >
                          {formatDate(selectedContact.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {selectedContact.isRead ? (
                      <button
                        onClick={() => handleMarkAsUnread(selectedContact.id)}
                        className="p-2 rounded-lg bg-accent hover:bg-accent/80 transition-colors"
                        title="Okunmadı olarak işaretle"
                      >
                        <Mail className="w-4 h-4 text-muted-foreground" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleMarkAsRead(selectedContact.id)}
                        className="p-2 rounded-lg bg-[#3B82F6]/10 hover:bg-[#3B82F6]/20 transition-colors"
                        title="Okundu olarak işaretle"
                      >
                        <CheckCircle2 className="w-4 h-4 text-[#3B82F6]" />
                      </button>
                    )}
                    <a
                      href={`mailto:${selectedContact.email}?subject=Re: ${encodeURIComponent(selectedContact.subject)}`}
                      className="p-2 rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] text-white transition-colors"
                      title="Mail gönder"
                    >
                      <Mail className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  <div className="flex items-center gap-2 mb-4">
                    <MessageSquare className="w-5 h-5 text-muted-foreground" />
                    <h3
                      className="font-semibold text-[#ebebeb]"
                      style={{
                        fontFamily: 'var(--font-display), "Space Grotesk", sans-serif',
                      }}
                    >
                      Mesaj
                    </h3>
                  </div>
                  <p
                    className="whitespace-pre-wrap leading-relaxed text-[#ebebeb]/90"
                    style={{
                      fontFamily: 'var(--font-sans), "Inter", sans-serif',
                    }}
                  >
                    {selectedContact.message}
                  </p>
                </div>
              </motion.div>
            ) : (
              <div className="bg-card border border-border rounded-2xl p-12 text-center text-[#ebebeb]">
                <Mail className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p
                  style={{
                    fontFamily: 'var(--font-sans), "Inter", sans-serif',
                  }}
                >
                  Bir mesaj seçin
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

