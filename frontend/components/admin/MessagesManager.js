"use client";

import { useEffect, useMemo, useState } from "react";
import { messageRows } from "./adminData";
import { ADMIN_DEMO_MODE, adminApi } from "./adminApi";
import { adaptMessage, toBackendStatus } from "./adminAdapters";
import { Icon } from "./AdminIcons";
import { ConfirmDialog, EmptyState, PageHeader, Toast } from "./AdminPrimitives";
import styles from "../../app/admin/admin.module.css";

const demoFilters = [
  ["Hamısı", "messages"],
  ["Oxunmamış", "mail"],
  ["Qəbul", "calendar"],
  ["Laboratoriya", "activity"],
  ["Korporativ", "departments"],
  ["Rəy", "sparkles"],
];

const liveFilters = [
  ["Hamısı", "messages"],
  ["Yeni", "mail"],
  ["İcradadır", "activity"],
  ["Həll olunub", "check"],
  ["Spam", "warning"],
];

function listFromResponse(data) {
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.items) ? data.items : [];
}

export default function MessagesManager() {
  const [messages, setMessages] = useState(() => ADMIN_DEMO_MODE ? messageRows : []);
  const [selectedId, setSelectedId] = useState(() => ADMIN_DEMO_MODE ? messageRows[0].id : null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Hamısı");
  const [replying, setReplying] = useState(false);
  const [reply, setReply] = useState("");
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(!ADMIN_DEMO_MODE);
  const [loadError, setLoadError] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  useEffect(() => {
    if (ADMIN_DEMO_MODE) return undefined;

    const controller = new AbortController();
    let cancelled = false;

    async function loadMessages() {
      setLoading(true);
      setLoadError(null);
      try {
        const data = await adminApi.messages.list({ limit: 100 }, { signal: controller.signal });
        if (cancelled) return;
        const nextMessages = listFromResponse(data).map(adaptMessage);
        setMessages(nextMessages);
        setSelectedId((current) => nextMessages.some((message) => message.id === current) ? current : nextMessages[0]?.id || null);
      } catch (error) {
        if (cancelled || error.name === "AbortError" || error.name === "SessionExpiredError") return;
        setLoadError(error.message || "Mesajları yükləmək mümkün olmadı.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadMessages();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [reloadKey]);

  const filtered = useMemo(() => messages.filter((message) => {
    const matchesText = `${message.sender} ${message.subject} ${message.preview}`.toLocaleLowerCase("az").includes(query.toLocaleLowerCase("az"));
    const matchesFilter = ADMIN_DEMO_MODE
      ? filter === "Hamısı" || (filter === "Oxunmamış" && message.unread) || message.category === filter
      : filter === "Hamısı" || message.statusLabel === filter;
    return matchesText && matchesFilter;
  }), [filter, messages, query]);
  const selected = messages.find((message) => message.id === selectedId);
  const messageFilters = ADMIN_DEMO_MODE ? demoFilters : liveFilters;

  async function persistMessage(message, statusLabel, successMessage, { quiet = false } = {}) {
    const controller = new AbortController();
    setSaving(true);
    try {
      const data = await adminApi.messages.update(message.id, {
        status: toBackendStatus(statusLabel),
        adminNotes: message.adminNotes?.trim() || null,
      }, { signal: controller.signal });
      const updated = adaptMessage(data);
      setMessages((current) => current.map((item) => item.id === message.id ? updated : item));
      if (!quiet) setToast({ tone: "success", message: successMessage });
    } catch (error) {
      if (error.name === "AbortError" || error.name === "SessionExpiredError") return;
      setToast({ tone: "warning", message: error.message || "Mesajın statusunu yeniləmək mümkün olmadı." });
    } finally {
      setSaving(false);
    }
  }

  function selectMessage(message) {
    setSelectedId(message.id);
    setReplying(false);
    if (ADMIN_DEMO_MODE) {
      setMessages((current) => current.map((item) => item.id === message.id ? { ...item, unread: false } : item));
    } else if (message.status === "NEW") {
      persistMessage(message, "İcradadır", "Mesaj icraya götürüldü.", { quiet: true });
    }
  }

  async function markAllRead() {
    if (ADMIN_DEMO_MODE) {
      setMessages((current) => current.map((item) => ({ ...item, unread: false })));
      setToast({ tone: "success", message: "Bütün mesajlar oxunmuş kimi işarələndi." });
      return;
    }

    const unreadMessages = messages.filter((message) => message.status === "NEW");
    if (!unreadMessages.length) {
      setToast({ tone: "success", message: "Yeni mesaj yoxdur." });
      return;
    }

    const controller = new AbortController();
    setSaving(true);
    try {
      const updated = await Promise.all(unreadMessages.map((message) => adminApi.messages.update(message.id, {
        status: toBackendStatus("İcradadır"),
        adminNotes: message.adminNotes?.trim() || null,
      }, { signal: controller.signal })));
      const updatedById = new Map(updated.map((message) => {
        const adapted = adaptMessage(message);
        return [adapted.id, adapted];
      }));
      setMessages((current) => current.map((message) => updatedById.get(message.id) || message));
      setToast({ tone: "success", message: "Bütün yeni mesajlar icraya götürüldü." });
    } catch (error) {
      if (error.name === "AbortError" || error.name === "SessionExpiredError") return;
      setToast({ tone: "warning", message: error.message || "Mesajları yeniləmək mümkün olmadı." });
    } finally {
      setSaving(false);
    }
  }

  function markUnread() {
    if (ADMIN_DEMO_MODE) {
      setMessages((current) => current.map((item) => item.id === selected.id ? { ...item, unread: true } : item));
      setToast({ tone: "success", message: "Mesaj oxunmamış kimi işarələndi." });
      return;
    }
    persistMessage(selected, "Yeni", "Mesaj yeni kimi işarələndi.");
  }

  async function confirmDeleteMessage() {
    const messageId = pendingDelete;
    if (!messageId) return;
    setSaving(true);
    try {
      if (!ADMIN_DEMO_MODE) await adminApi.messages.remove(messageId);
      const remaining = messages.filter((message) => message.id !== messageId);
      setMessages(remaining);
      setSelectedId(remaining[0]?.id || null);
      setReplying(false);
      setPendingDelete(null);
      setToast({ tone: "success", message: "Mesaj uğurla silindi." });
    } catch (error) {
      if (error.name === "SessionExpiredError") return;
      setPendingDelete(null);
      setToast({
        tone: "warning",
        message: error.message || "Mesajı silmək mümkün olmadı."
      });
    } finally {
      setSaving(false);
    }
  }

  function refreshMessages() {
    if (ADMIN_DEMO_MODE) {
      setToast({ tone: "success", message: "Mesaj siyahısı yeniləndi." });
      return;
    }
    setReloadKey((value) => value + 1);
  }

  async function sendReply() {
    if (!reply.trim()) {
      setToast({ tone: "warning", message: "Cavab mətni boş ola bilməz." });
      return;
    }
    if (ADMIN_DEMO_MODE) {
      setReply("");
      setReplying(false);
      setToast({
        tone: "success",
        message: "Cavab göndərilmək üçün hazırlanıb və fəaliyyət jurnalına əlavə edildi."
      });
      return;
    }

    const timestamp = new Intl.DateTimeFormat("az-AZ", {
      dateStyle: "short",
      timeStyle: "short"
    }).format(new Date());
    const adminNotes = [
      selected.adminNotes,
      `[Cavab qaralaması · ${timestamp}]\n${reply.trim()}`
    ].filter(Boolean).join("\n\n");
    setSaving(true);
    try {
      const data = await adminApi.messages.update(selected.id, {
        status: selected.status === "NEW" ? "IN_PROGRESS" : selected.status,
        adminNotes
      });
      const updated = adaptMessage(data);
      setMessages((current) =>
        current.map((message) =>
          message.id === selected.id ? updated : message
        )
      );
      setReply("");
      setReplying(false);
      setToast({
        tone: "success",
        message: "Cavab qaralaması daxili qeydlərdə yadda saxlanıldı; e-mail göndərilmədi."
      });
    } catch (error) {
      if (error.name === "SessionExpiredError") return;
      setToast({
        tone: "warning",
        message: error.message || "Cavab qaralamasını yadda saxlamaq mümkün olmadı."
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.messagesPage}>
      <PageHeader
        eyebrow="Əlaqə mərkəzi"
        title="Mesajlar"
        description="Saytın əlaqə formundan daxil olan müraciətləri prioritetləşdirin və daxili cavab qeydləri hazırlayın."
        actions={(
          <button className={styles.secondaryButton} disabled={saving || loading} type="button" onClick={markAllRead}>
            <Icon name="check" size={17} />{ADMIN_DEMO_MODE ? "Hamısını oxu" : "Hamısını icraya götür"}
          </button>
        )}
      />

      <section className={styles.inboxShell}>
        <aside className={styles.inboxSidebar}>
          <div className={styles.inboxSearch}>
            <Icon name="search" size={17} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Mesajlarda axtar..." aria-label="Mesajlarda axtarış" />
          </div>
          <nav aria-label="Mesaj filterləri">
            {messageFilters.map(([label, icon]) => (
              <button className={filter === label ? styles.inboxFilterActive : ""} type="button" key={label} onClick={() => setFilter(label)}>
                <Icon name={icon} size={17} />
                <span>{label}</span>
                <small>
                  {label === "Hamısı"
                    ? messages.length
                    : ADMIN_DEMO_MODE
                      ? messages.filter((message) => label === "Oxunmamış" ? message.unread : message.category === label).length
                      : messages.filter((message) => message.statusLabel === label).length}
                </small>
              </button>
            ))}
          </nav>
          {ADMIN_DEMO_MODE && <div className={styles.inboxStorage}>
            <div><span style={{ "--used": "34%" }} /></div>
            <p><strong>3.4 GB</strong> / 10 GB istifadə olunur</p>
          </div>}
        </aside>

        <div className={styles.messageListPane}>
          <div className={styles.messageListHeader}>
            <div><strong>Gələnlər</strong><small>{filtered.length} mesaj</small></div>
            <button disabled={loading} type="button" aria-label="Siyahını yenilə" onClick={refreshMessages}><Icon name="activity" size={17} /></button>
          </div>
          <div className={styles.messageList}>
            {loading ? (
              <div className={styles.adminLoading} aria-label="Mesajlar yüklənir" aria-live="polite">
                <div className={styles.loadingPanel}><span /><span /><span /><span /></div>
              </div>
            ) : loadError ? (
              <EmptyState
                icon="warning"
                title="Mesajlar yüklənmədi"
                description={loadError}
                action={<button className={styles.secondaryButton} type="button" onClick={() => setReloadKey((value) => value + 1)}>Yenidən cəhd et</button>}
              />
            ) : filtered.length ? filtered.map((message) => (
              <button
                className={`${styles.messageItem} ${selectedId === message.id ? styles.messageItemActive : ""} ${message.unread ? styles.messageUnread : ""}`}
                type="button"
                key={message.id}
                onClick={() => selectMessage(message)}
              >
                <span className={styles.messageAvatar}>{message.sender.split(" ").map((part) => part[0]).join("")}</span>
                <div>
                  <div><strong>{message.sender}</strong><time>{message.time}</time></div>
                  <h3>{message.subject}</h3>
                  <p>{message.preview}</p>
                  <span>{ADMIN_DEMO_MODE ? message.category : message.statusLabel}</span>
                </div>
                {message.unread && <i aria-label="Oxunmamış" />}
              </button>
            )) : (
              <EmptyState
                title={messages.length ? "Mesaj tapılmadı" : "Mesaj yoxdur"}
                description={messages.length ? "Axtarış və filterlərə uyğun mesaj yoxdur." : "Yeni əlaqə müraciətləri daxil olduqda burada görünəcək."}
              />
            )}
          </div>
        </div>

        <article className={`${styles.messageReader} ${selected ? styles.messageReaderOpen : ""}`}>
          {!loading && !loadError && selected ? (
            <>
              <header className={styles.readerHeader}>
                <div className={styles.readerMobileBack}>
                  <button type="button" aria-label="Mesaj siyahısına qayıt" onClick={() => setSelectedId(null)}><Icon name="chevronRight" size={18} /></button>
                </div>
                <div>
                  <span>{ADMIN_DEMO_MODE ? selected.category : selected.statusLabel}</span>
                  <h2>{selected.subject}</h2>
                </div>
                <div className={styles.readerActions}>
                  <button disabled={saving} type="button" aria-label="Oxunmamış kimi işarələ" onClick={markUnread}><Icon name="mail" size={17} /></button>
                  {!ADMIN_DEMO_MODE && <button disabled={saving} type="button" aria-label="Spam kimi işarələ" onClick={() => persistMessage(selected, "Spam", "Mesaj spam kimi işarələndi.")}><Icon name="warning" size={17} /></button>}
                  <button className={styles.readerDeleteAction} disabled={saving} type="button" aria-label="Mesajı sil" onClick={() => setPendingDelete(selected.id)}><Icon name="trash" size={17} /></button>
                  {!ADMIN_DEMO_MODE && <button disabled={saving} type="button" aria-label="Həll edilmiş kimi işarələ" onClick={() => persistMessage(selected, "Həll olunub", "Mesaj həll edilmiş kimi işarələndi.")}><Icon name="check" size={17} /></button>}
                </div>
              </header>
              <div className={styles.senderCard}>
                <span className={styles.senderAvatar}>{selected.sender.split(" ").map((part) => part[0]).join("")}</span>
                <div><strong>{selected.sender}</strong><a href={`mailto:${selected.email}`}>{selected.email}</a></div>
                <time>{selected.date}, {selected.time}</time>
              </div>
              <div className={styles.messageBody}>
                <p>Hörmətli Medicare komandası,</p>
                <p>{selected.body}</p>
                <p>Hörmətlə,<br />{selected.sender}</p>
              </div>
              <div className={styles.senderDetails}>
                <div><Icon name="phone" size={16} /><span><small>Telefon</small><a href={`tel:${selected.phone.replaceAll(" ", "")}`}>{selected.phone}</a></span></div>
                <div><Icon name="mail" size={16} /><span><small>E-mail</small><a href={`mailto:${selected.email}`}>{selected.email}</a></span></div>
                <div><Icon name="clock" size={16} /><span><small>Müraciət ID</small><strong>{selected.id}</strong></span></div>
              </div>
              {replying ? (
                <div className={styles.replyComposer}>
                  <div><strong>{selected.email}</strong><button type="button" aria-label="Cavabı bağla" onClick={() => setReplying(false)}><Icon name="close" size={16} /></button></div>
                  <textarea value={reply} onChange={(event) => setReply(event.target.value)} rows={6} placeholder="Cavabınızı yazın..." autoFocus />
                  <footer>
                    <span>
                      <Icon name="info" size={14} />
                      {ADMIN_DEMO_MODE ? "Cavab göndərilməzdən əvvəl server tərəfindən yoxlanacaq." : "Qaralama backend-də daxili qeyd kimi saxlanacaq; e-mail göndərilməyəcək."}
                    </span>
                    <button className={styles.primaryButton} disabled={saving} type="button" onClick={sendReply}>
                      <Icon name="mail" size={16} />{ADMIN_DEMO_MODE ? "Cavabı göndər" : saving ? "Saxlanılır..." : "Daxili qeyddə saxla"}
                    </button>
                  </footer>
                </div>
              ) : (
                <div className={styles.readerFooter}>
                  <button className={styles.primaryButton} type="button" onClick={() => setReplying(true)}><Icon name="mail" size={17} />{ADMIN_DEMO_MODE ? "Cavabla" : "Cavab qaralaması"}</button>
                  <a className={styles.secondaryButton} href={`tel:${selected.phone.replaceAll(" ", "")}`}><Icon name="phone" size={17} />Zəng et</a>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              icon="messages"
              title={loading ? "Mesajlar yüklənir" : loadError ? "Mesajlar əlçatan deyil" : "Mesaj seçin"}
              description={loading ? "Gələnlər qutusu serverdən alınır." : loadError ? "Siyahını yenidən yüklədikdən sonra mesajı seçin." : "Oxumaq və daxili cavab qeydi hazırlamaq üçün siyahıdan mesaj seçin."}
            />
          )}
        </article>
      </section>
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Mesaj silinsin?"
        description="Mesaj gələnlər qutusundan silinəcək. Bu əməl audit jurnalında qeydə alınacaq."
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDeleteMessage}
      />
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
    </div>
  );
}
