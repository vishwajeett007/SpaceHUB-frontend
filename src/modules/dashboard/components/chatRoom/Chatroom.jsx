import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadFileAndGetUrl, getPresignedDownloadUrl } from '../../../../shared/services/API';

const systemVariantStyles = {
  'chat-join': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'voice-join': 'bg-indigo-50 text-indigo-700 border border-indigo-200',
};

const contentTypeMap = {
  'jpg': 'image/jpeg',
  'jpeg': 'image/jpeg',
  'png': 'image/png',
  'gif': 'image/gif',
  'webp': 'image/webp',
  'svg': 'image/svg+xml',
  'bmp': 'image/bmp',
  'pdf': 'application/pdf',
  'doc': 'application/msword',
  'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'xls': 'application/vnd.ms-excel',
  'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'ppt': 'application/vnd.ms-powerpoint',
  'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'xml': 'application/xml',
  'zip': 'application/zip',
  'rar': 'application/x-rar-compressed',
  '7z': 'application/x-7z-compressed',
  'txt': 'text/plain',
  'csv': 'text/csv',
  'rtf': 'application/rtf',
  'odt': 'application/vnd.oasis.opendocument.text',
  'ods': 'application/vnd.oasis.opendocument.spreadsheet',
  'odp': 'application/vnd.oasis.opendocument.presentation'
};

const formatTime = (date) => {
  const d = new Date(date);
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'pm' : 'am';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  return `${displayHours}:${displayMinutes}${ampm}`;
};

const formatDateChip = (date) => {
  const d = new Date(date);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  if (isToday) return 'Today';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

const shouldClampMessage = (text) => {
  if (!text) return false;
  const textStr = String(text);
  if (!textStr) return false;
  const approxLineBreaks = (textStr.match(/\n/g) || []).length + 1;
  if (approxLineBreaks > 15) return true;
  return textStr.length > 900;
};

const downloadFile = async (url, filename) => {
  if (!url) return;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Fetch failed');
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = blobUrl;
    anchor.download = filename || 'download';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
  } catch {
    try {
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename || 'download';
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } catch {
      window.open(url, '_blank');
    }
  }
};

const ChatRoom = ({
  title = '#general',
  currentUser = {},
  messages = [],
  onSend,
  chatUser = null, 
  onBack = null,
  sendMessage = null,
  onToggleRightPanel = null,
  isReadOnly = false,
}) => {
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [attachments, setAttachments] = useState([]); 
  const [expandedMessageIds, setExpandedMessageIds] = useState({});
  const [presignedUrls, setPresignedUrls] = useState({}); // Cache for presigned URLs
  const [enlargedImage, setEnlargedImage] = useState(null);

  const fileInputRef = useRef(null);
  const messageInputRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const emojis = useMemo(() => ['😊', '😂', '🎉', '🔥', '👍', '❤️'], []);

  const handleFileDownload = useCallback(async (fileUrl, fileKey, fileName, contentType) => {
    const targetKey = fileKey || fileUrl;
    let targetUrl = (fileUrl && (fileUrl.startsWith('http') || fileUrl.startsWith('data:')))
      ? fileUrl
      : (fileKey && (fileKey.startsWith('http') || fileKey.startsWith('data:')))
        ? fileKey
        : presignedUrls[targetKey];

    if (!targetUrl && targetKey) {
      try {
        const ext = (fileName || targetKey).split('.').pop()?.toLowerCase();
        const cType = contentType || contentTypeMap[ext] || 'application/octet-stream';
        targetUrl = await getPresignedDownloadUrl(targetKey, cType);
        if (targetUrl) {
          setPresignedUrls((prev) => ({ ...prev, [targetKey]: targetUrl }));
        }
      } catch (err) {
        console.error('Failed to resolve presigned download URL dynamically:', err);
      }
    }

    if (targetUrl) {
      await downloadFile(targetUrl, fileName || 'download');
    } else {
      window.dispatchEvent(new CustomEvent('toast', {
        detail: { message: 'Download URL unavailable. Please try again.', type: 'error' }
      }));
    }
  }, [presignedUrls]);

  // Fetch presigned URLs for fileKeys
  useEffect(() => {
    const fetchPresignedUrls = async () => {
      const fileKeysToFetch = new Set();
      
      messages.forEach((msg) => {
        if (Array.isArray(msg.images)) {
          msg.images.forEach((img) => {
            if (img && !img.startsWith('http') && !presignedUrls[img]) {
              fileKeysToFetch.add(img);
            }
          });
        }
        if (msg.isFile && msg.fileKey && !msg.fileKey.startsWith('http') && !presignedUrls[msg.fileKey]) {
          fileKeysToFetch.add(msg.fileKey);
        }
        if (msg.isFile && msg.fileUrl && !msg.fileUrl.startsWith('http') && !presignedUrls[msg.fileUrl]) {
          fileKeysToFetch.add(msg.fileUrl);
        }
      });

      if (fileKeysToFetch.size === 0) return;

      const fetchPromises = Array.from(fileKeysToFetch).map(async (fileKey) => {
        try {
          const extension = fileKey.split('.').pop()?.toLowerCase();
          const contentType = contentTypeMap[extension] || 'application/octet-stream';
          
          const url = await getPresignedDownloadUrl(fileKey, contentType);
          if (url) {
            setPresignedUrls(prev => ({ ...prev, [fileKey]: url }));
          }
        } catch (error) {
          console.error(`Failed to get presigned URL for ${fileKey}:`, error);
        }
      });

      await Promise.all(fetchPromises);
    };

    if (messages.length > 0) {
      fetchPresignedUrls();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  useEffect(() => {
    if (messageInputRef.current) {
      messageInputRef.current.focus();
    }
  }, [title]);

  const onPickFiles = useCallback(() => fileInputRef.current?.click(), []);

  const onFilesSelected = useCallback(async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    const newAttachments = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      fileKey: null,
      fileUrl: null,
      uploading: true,
      fileName: file.name,
      contentType: file.type || 'application/octet-stream'
    }));
    
    setAttachments((prev) => [...prev, ...newAttachments]);
    e.target.value = '';
    
    newAttachments.forEach(async (attachment) => {
      try {
        const uploadResult = await uploadFileAndGetUrl(attachment.file);
        
        setAttachments((prev) => {
          const updated = [...prev];
          const attachmentIndex = prev.findIndex(
            (att) => att.file === attachment.file && att.uploading === true
          );
          if (attachmentIndex !== -1) {
            updated[attachmentIndex] = {
              ...updated[attachmentIndex],
              fileKey: uploadResult.fileKey,
              fileUrl: uploadResult.fileUrl,
              fileName: uploadResult.fileName || attachment.fileName,
              contentType: uploadResult.contentType || attachment.contentType,
              uploading: false
            };
          }
          return updated;
        });
      } catch (error) {
        console.error('Failed to upload file:', error);
        window.dispatchEvent(new CustomEvent('toast', {
          detail: { message: `Failed to upload ${attachment.fileName}: ${error.message}`, type: 'error' }
        }));
        
        setAttachments((prev) => prev.filter((att) => att.file !== attachment.file));
      }
    });
  }, []);

  const onEmojiClick = useCallback((e) => {
    setMessage((prev) => prev + e);
    setShowEmoji(false);
  }, []);

  const toggleExpand = useCallback((id) => {
    setExpandedMessageIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const handleSend = useCallback(() => {
    const trimmed = message.trim();
    const readyAttachments = attachments.filter(
      (att) => !att.uploading && (att.fileKey || att.fileUrl)
    );
    
    if (!trimmed && readyAttachments.length === 0) {
      if (attachments.some(att => att.uploading)) {
        window.dispatchEvent(new CustomEvent('toast', {
          detail: { message: 'Please wait for files to finish uploading', type: 'info' }
        }));
      }
      return;
    }
    
    const selfAvatar = currentUser?.avatarUrl || '/avatars/avatar-1.png';
    const selfName = currentUser?.username || currentUser?.email || 'You';
    
    if (sendMessage) {
      sendMessage(trimmed, readyAttachments);
    } else {
      const newMsg = {
        id: `m-${Date.now()}`,
        author: selfName,
        email: currentUser?.email || 'me',
        text: trimmed,
        createdAt: new Date().toISOString(),
        avatar: selfAvatar,
        isSelf: true,
        images: readyAttachments.filter(att => {
          const isImage = att.contentType?.startsWith('image/') || 
            ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(
              att.fileName?.toLowerCase().split('.').pop()
            );
          return isImage;
        }).map((a) => a.fileKey || a.fileUrl),
        attachments: readyAttachments
      };
      onSend?.(newMsg);
    }
    
    setMessage('');
    try {
      attachments.forEach((a) => URL.revokeObjectURL(a.url));
    } catch {
      // Object URL cleanup is best-effort.
    }
    setAttachments([]);
    try {
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
        }
      });
    } catch {
      // Scrolling is a non-critical enhancement.
    }
  }, [message, attachments, currentUser, sendMessage, onSend]);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleBack = useCallback(() => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  }, [onBack, navigate]);

  const displayName = chatUser?.name || title;
  const displayAvatar = chatUser?.avatar || '/avatars/avatar-1.png';

  const wsStatusDisplay = useMemo(() => {
    const status = chatUser?.wsStatus || 'not-connected';
    switch (status) {
      case 'connected':
        return { text: 'Connected', textColor: 'text-green-600', dotColor: 'bg-green-600' };
      case 'connecting':
        return { text: 'Connecting', textColor: 'text-gray-600', dotColor: 'bg-gray-500' };
      case 'not-connected':
      default:
        return { text: 'Not connected', textColor: 'text-orange-600', dotColor: 'bg-orange-500' };
    }
  }, [chatUser?.wsStatus]);

  return (
    <div className="flex-1 min-w-0 bg-white h-full md:h-[calc(100vh-56px)] flex flex-col rounded-xl border border-gray-500 overflow-hidden md:bg-white">
      {/* Header - Mobile Design */}
      <div className="h-14 md:h-12 border-b border-gray-300 flex items-center justify-between px-4 bg-white">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Back Button*/}
          {onBack && (
            <button
              onClick={handleBack}
              className="md:hidden p-1 -ml-1 text-gray-700 hover:text-gray-900"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          
          {/* User Info */}
          {chatUser ? (
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                <img
                  src={displayAvatar}
                  alt={displayName}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = '/avatars/avatar-1.png';
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 truncate text-base">{displayName}</div>
                <div className={`text-xs flex items-center gap-1 ${wsStatusDisplay.textColor}`}>
                  <span className={`w-2 h-2 ${wsStatusDisplay.dotColor} rounded-full`}></span>
                  {wsStatusDisplay.text}
                </div>
              </div>
            </div>
          ) : (
            <div className="font-semibold text-gray-800 truncate">{title}</div>
          )}
        </div>
        
        {/* Action Buttons */}
        {onToggleRightPanel && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={onToggleRightPanel}
              className="p-2 text-gray-700 hover:text-gray-900 lg:hidden"
              title="Members"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 space-y-4 bg-gray-50">
        {messages && messages.length > 0 && (
          <>
            <div className="flex justify-center">
              <span className="px-3 py-1 bg-gray-300 text-gray-700 rounded-full text-xs font-medium">{formatDateChip(messages[0].createdAt)}</span>
            </div>
            {messages.map((m, idx) => {
              const prev = messages[idx - 1];
              const showDateChip = !!prev && formatDateChip(prev.createdAt) !== formatDateChip(m.createdAt);
              const isSelf = !!m.isSelf;
              
              if (m.type === 'system') {
                const variantClass = systemVariantStyles[m.systemVariant] || 'bg-gray-200 text-gray-700 border border-gray-300';
                return (
                  <React.Fragment key={m.id}>
                    {showDateChip && (
                      <div className="flex justify-center mt-2">
                        <span className="px-3 py-1 bg-gray-300 text-gray-700 rounded-full text-xs font-medium">{formatDateChip(m.createdAt)}</span>
                      </div>
                    )}
                    <div className="flex justify-center mt-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${variantClass}`}>
                        {typeof m.text === 'string' ? m.text : (m.text ? String(m.text) : '')}
                      </span>
                    </div>
                  </React.Fragment>
                );
              }

              return (
                <React.Fragment key={m.id}>
                  {showDateChip && (
                    <div className="flex justify-center mt-2">
                      <span className="px-3 py-1 bg-gray-300 text-gray-700 rounded-full text-xs font-medium">{formatDateChip(m.createdAt)}</span>
                    </div>
                  )}
                  <div className="flex gap-3 justify-start items-start">
                    <div className="hidden" />
                    
                    {/* Message Bubble */}
                    <div className="flex flex-col items-start flex-1 min-w-0 w-full">
                      <div className={`rounded-sm border-l-4 px-4 py-3 w-full ${
                        isSelf 
                          ? 'bg-yellow-100/90 border border-yellow-300 border-l-yellow-400' 
                          : 'bg-zinc-200 border border-gray-400 border-l-gray-600'
                      }`}>
                        {/* Author Header */}
                        <div className="flex items-center gap-2 mb-2">
                          <img
                            src={m.avatar || '/avatars/avatar-1.png'}
                            alt={m.author || 'User'}
                            className="w-7 h-7 rounded-full object-cover"
                            onError={(e) => { e.target.src = '/avatars/avatar-1.png'; }}
                          />
                          <span className="font-semibold text-gray-800 text-sm">{m.author || 'User'}</span>
                          <span className="text-xs text-gray-500">{formatTime(m.createdAt)}</span>
                        </div>

                        {/* Text Message Content */}
                        {Boolean(m.text && (!m.isFile || (m.text !== m.fileName && m.text !== 'file'))) && (
                          <div 
                            className="whitespace-pre-wrap break-words text-sm text-gray-800 text-left mb-2"
                            style={
                              shouldClampMessage(m.text) && !expandedMessageIds[m.id]
                                ? { maxHeight: '22.5rem', overflow: 'hidden' }
                                : {}
                            }
                          >
                            {typeof m.text === 'string' ? m.text : (m.text ? String(m.text) : '')}
                          </div>
                        )}
                        {shouldClampMessage(m.text) && (
                          <button
                            onClick={() => toggleExpand(m.id)}
                            className="mt-1 mb-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {expandedMessageIds[m.id] ? 'Show less' : 'Show more'}
                          </button>
                        )}

                        {/* Image Previews */}
                        {Array.isArray(m.images) && m.images.length > 0 && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-2 max-w-full">
                            {m.images.map((img, i) => {
                              const imageUrl = (img && (img.startsWith('http') || img.startsWith('data:')))
                                ? img
                                : (presignedUrls[img] || (m.fileUrl && m.fileUrl.startsWith('http') ? m.fileUrl : img));

                              return (
                                <div key={i} className="rounded-lg overflow-hidden bg-gray-200/80 border border-gray-300 relative group max-w-md">
                                  <img
                                    src={imageUrl}
                                    alt={m.fileName || 'attachment'}
                                    onClick={() => setEnlargedImage({ url: imageUrl, fileName: m.fileName || `image-${i + 1}` })}
                                    className="w-full h-auto object-cover max-h-80 rounded-md cursor-zoom-in hover:opacity-95 transition-opacity"
                                    title="Click to enlarge"
                                    onError={(e) => {
                                      e.target.style.opacity = '0.4';
                                    }}
                                  />
                                  <button
                                    onClick={() => handleFileDownload(
                                      imageUrl,
                                      img,
                                      m.fileName || `image-${i + 1}`,
                                      m.contentType || 'image/png'
                                    )}
                                    className="absolute top-2 right-2 bg-black/85 hover:bg-black text-white rounded-md px-3 py-1.5 text-xs font-semibold shadow-md flex items-center gap-1.5 cursor-pointer z-10"
                                    title="Download Image"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    <span>Download</span>
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Shared File Attachment Card & Download Button (for non-images or files without image preview array) */}
                        {(!Array.isArray(m.images) || m.images.length === 0) && (m.isFile || m.fileKey || m.fileUrl || String(m.type || '').toUpperCase() === 'FILE') && (
                          <div className="mt-2 bg-white/90 rounded-lg p-3 flex items-center justify-between gap-3 border border-gray-300 shadow-sm">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center flex-shrink-0">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="text-sm font-semibold text-gray-900 truncate" title={m.fileName || m.text || 'Shared File'}>
                                  {m.fileName || m.text || 'Shared File'}
                                </div>
                                <div className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                                  {m.contentType ? (m.contentType.split('/')[1] || m.contentType) : (m.fileName?.split('.').pop() || 'FILE')}
                                </div>
                              </div>
                            </div>
                            
                            <button
                              onClick={() => handleFileDownload(
                                m.fileUrl || (m.images && m.images[0]),
                                m.fileKey,
                                m.fileName || m.text || 'file',
                                m.contentType
                              )}
                              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors flex-shrink-0 shadow-sm cursor-pointer"
                              title="Download File"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              <span>Download</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    
                  </div>
                </React.Fragment>
              );
            })}
          </>
        )}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="mb-4">
              <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No messages yet</h3>
            <p className="text-gray-500 max-w-md">Start the conversation!</p>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="px-2 py-2 sm:px-3 sm:py-2.5 md:px-4 md:py-3 bg-black/90">
        {attachments.length > 0 && (
          <div className="mb-2 grid grid-cols-3 gap-2">
            {attachments.map((a, idx) => (
              <div key={idx} className="relative rounded-lg overflow-hidden bg-gray-600 border border-gray-500">
                {a.uploading ? (
                  <div className="w-full h-20 flex items-center justify-center bg-gray-700">
                    <div className="text-white text-xs">Uploading...</div>
                  </div>
                ) : (
                  <img src={a.url} alt="preview" className="w-full h-20 object-cover" />
                )}
                <button
                  onClick={() => {
                    setAttachments((prev) => {
                      const updated = prev.filter((_, i) => i !== idx);
                      try {
                        URL.revokeObjectURL(a.url);
                      } catch {
                        // Object URL cleanup is best-effort.
                      }
                      return updated;
                    });
                  }}
                  className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-black/80"
                  title="Remove"
                >
                  <img src="/icons/delete.svg" alt="Remove attachment" className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="relative flex items-center gap-1.5 sm:gap-2">
          {/* Emoji Button */}
          <button
            onClick={() => setShowEmoji(!showEmoji)}
            disabled={isReadOnly}
            className="p-1.5 sm:p-2 text-white hover:text-gray-200 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Emoji"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          
          {/* Attachment Button */}
          <button
            onClick={onPickFiles}
            disabled={isReadOnly}
            className="p-1.5 sm:p-2 text-white hover:text-gray-200 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Attach file"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          <input 
            ref={fileInputRef} 
            type="file" 
            multiple 
            className="hidden" 
            onChange={onFilesSelected}
            accept=".pdf,.xml,.pptx,.ppt,.doc,.docx,.xls,.xlsx,.txt,.csv,.rtf,.zip,.rar,.7z,.odt,.ods,.odp,image/*" 
          />
          
          {/* Message Input */}
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={isReadOnly ? 'Only admins can send messages here' : (title.startsWith('#') ? title : `#${title}`)}
            disabled={isReadOnly}
            className="flex-1 bg-white text-black placeholder-gray-400 rounded-md px-2 py-2 sm:px-3 sm:py-2 md:px-4 md:py-2.5 outline-none transition-colors text-left text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100"
            ref={messageInputRef}
          />
          
          {/* Send Button */}
          <button
            onClick={handleSend}
            disabled={isReadOnly || (!message.trim() && attachments.filter(att => !att.uploading && (att.fileKey || att.fileUrl)).length === 0) || attachments.some(att => att.uploading)}
            className="p-1.5 sm:p-2 text-white hover:text-gray-200 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Send"
          >
            <img src="/icons/msg_send_icon.svg" alt="Send message" className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          
          {/* Emoji Picker */}
          {showEmoji && (
            <div className="absolute bottom-14 left-2 bg-gray-800 text-white rounded-lg shadow-lg border border-gray-600 p-2 grid grid-cols-6 gap-2 z-10">
              {emojis.map((em) => (
                <button
                  key={em}
                  onClick={() => onEmojiClick(em)}
                  className="text-xl hover:scale-110 transition-transform p-1"
                  title={em}
                >
                  {em}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Image Enlargement Modal Lightbox */}
      {enlargedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-fadeIn"
          onClick={() => setEnlargedImage(null)}
        >
          <div
            className="relative max-w-5xl max-h-[90vh] flex flex-col items-center justify-center bg-transparent rounded-lg p-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Action Bar */}
            <div className="w-full flex items-center justify-between gap-4 mb-3 text-white">
              <div className="text-sm font-semibold truncate max-w-md">
                {enlargedImage.fileName || 'Image Preview'}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleFileDownload(enlargedImage.url, null, enlargedImage.fileName || 'image', 'image/png')}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold shadow-md flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>Download</span>
                </button>

                <button
                  onClick={() => setEnlargedImage(null)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-colors cursor-pointer text-sm font-bold"
                  title="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Enlarged Image */}
            <img
              src={enlargedImage.url}
              alt={enlargedImage.fileName || 'Enlarged Preview'}
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl border border-white/10 select-none"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(ChatRoom);
