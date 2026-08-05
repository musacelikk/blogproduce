'use client';

import { useState, useEffect } from 'react';
import {
  Mail,
  MailOpen,
  Clock,
  User,
  MessageSquare,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
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
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Mesajlar"
        description="Bize ulaşın formundan gelen mesajları görüntüleyin ve yönetin"
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          Tümü ({contacts.length})
        </Button>
        <Button
          variant={filter === 'unread' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('unread')}
        >
          <Mail className="h-4 w-4" />
          Okunmamış ({unreadCount})
        </Button>
        <Button
          variant={filter === 'read' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('read')}
        >
          Okundu ({contacts.length - unreadCount})
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Contact List */}
        <div className="lg:col-span-1">
          {filteredContacts.length === 0 ? (
            <EmptyState icon={<Mail />} title="Henüz mesaj yok" />
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
              <div className="max-h-[calc(100vh-300px)] divide-y divide-border overflow-y-auto">
                {filteredContacts.map((contact) => (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => handleContactClick(contact)}
                    className={cn(
                      'block w-full cursor-pointer border-l-2 p-4 text-left transition-colors hover:bg-secondary',
                      selectedContact?.id === contact.id
                        ? 'border-l-primary bg-accent'
                        : 'border-l-transparent',
                    )}
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-2">
                          {!contact.isRead && (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                          )}
                          <h3
                            className={cn(
                              'truncate text-sm font-semibold',
                              contact.isRead ? 'text-muted-foreground' : 'text-foreground',
                            )}
                          >
                            {contact.name}
                          </h3>
                        </div>
                        <p className="truncate text-sm text-muted-foreground">{contact.subject}</p>
                      </div>
                      {contact.isRead ? (
                        <MailOpen className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <Mail className="ml-2 h-4 w-4 shrink-0 text-primary" />
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span>{formatDate(contact.createdAt)}</span>
                      <a
                        href={`mailto:${contact.email}`}
                        onClick={(e) => e.stopPropagation()}
                        className="truncate transition-colors hover:text-accent-foreground"
                      >
                        {contact.email}
                      </a>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Contact Detail */}
        <div className="lg:col-span-2">
          {selectedContact ? (
            <div className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold tracking-tight text-foreground">
                    {selectedContact.subject}
                  </h2>
                  <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 shrink-0" />
                      <span>{selectedContact.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 shrink-0" />
                      <a
                        href={`mailto:${selectedContact.email}`}
                        className="transition-colors hover:text-accent-foreground"
                      >
                        {selectedContact.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 shrink-0" />
                      <span>{formatDate(selectedContact.createdAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  {selectedContact.isRead ? (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleMarkAsUnread(selectedContact.id)}
                      title="Okunmadı olarak işaretle"
                      aria-label="Okunmadı olarak işaretle"
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleMarkAsRead(selectedContact.id)}
                      title="Okundu olarak işaretle"
                      aria-label="Okundu olarak işaretle"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </Button>
                  )}
                  <Button asChild size="icon" title="Mail gönder">
                    <a
                      href={`mailto:${selectedContact.email}?subject=Re: ${encodeURIComponent(selectedContact.subject)}`}
                      aria-label="Mail gönder"
                    >
                      <Mail className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>

              <div className="border-t border-border pt-6">
                <div className="mb-4 flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-base font-semibold text-foreground">Mesaj</h3>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {selectedContact.message}
                </p>
              </div>
            </div>
          ) : (
            <EmptyState icon={<Mail />} title="Bir mesaj seçin" />
          )}
        </div>
      </div>
    </div>
  );
}
