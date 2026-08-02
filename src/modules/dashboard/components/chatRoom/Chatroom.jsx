import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadFileAndGetUrl, getPresignedDownloadUrl } from '../../../../shared/services/API';

const systemVariantStyles = {
  'chat-join': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  'voice-join': 'bg-indigo-50 text-indigo-700 border border-indigo-200',
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

  const fileInputRef = useRef(null);
  const messageInputRef = useRef(null);
  const scrollContainerRef = useRef(null);

  const emojis = useMemo(() => ['😊', '😂', '🎉', '🔥', '👍', '❤️'], []);

  // Fetch presigned URLs for fileKeys
  useEffect(() => {
    const fetchPresignedUrls = async () => {
      const fileKeysToFetch = new Set();
      
      messages.forEach((msg) => {
        // Check images
        if (Array.isArray(msg.images)) {
          msg.images.forEach((img) => {
            // If it's a fileKey (not a full URL), add to fetch list
            if (img && !img.startsWith('http') && !presignedUrls[img]) {
              fileKeysToFetch.add(img);
            }
          });
        }
        // Check fileUrl/fileKey for non-image files
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
          // Determine content type from file extension
          const extension = fileKey.split('.').pop()?.toLowerCase();
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

  // Auto-focus message input when component mounts or title changes
  useEffect(() => {
    if (messageInputRef.current) {
      messageInputRef.current.focus();
    }
  }, [title]);

  const onPickFiles = () => fileInputRef.current?.click();
  const onFilesSelected = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    // Create attachment objects with preview URLs
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
        
        // Update attachment with fileKey and mark as not uploading
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
        
        // Remove failed attachment
        setAttachments((prev) => prev.filter((att) => att.file !== attachment.file));
      }
    });
  };

  const onEmojiClick = (e) => {
    setMessage((prev) => prev + e);
    setShowEmoji(false);
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
    // Ensure text is a string
    const textStr = String(text);
    if (!textStr) return false;
    const approxLineBreaks = (textStr.match(/\n/g) || []).length + 1;
    if (approxLineBreaks > 15) return true;
    return textStr.length > 900;
  };

  const toggleExpand = (id) => {
    setExpandedMessageIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSend = () => {
    const trimmed = message.trim();
    // Filter out attachments that are still uploading or don't have fileKey
    const readyAttachments = attachments.filter(
      (att) => !att.uploading && (att.fileKey || att.fileUrl)
    );
    
    // Allow sending if there's any message content (including emojis) or ready attachments
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
      // For WebSocket-based direct chat, pass text and attachments with fileKey
      sendMessage(trimmed, readyAttachments);
    } else {
      // For regular chat (community), send FILE type messages for files and regular message for text
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
        attachments: readyAttachments // Pass attachments so onSend can send FILE type messages
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
  };

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  const displayName = chatUser?.name || title;
  const displayAvatar = chatUser?.avatar || '/avatars/avatar-1.png';
  const getWsStatusDisplay = () => {
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
  };
  
  const wsStatusDisplay = getWsStatusDisplay();

  const downloadFile = (url, filename) => {
    try {
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = filename || 'download';
      anchor.target = '_blank';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } catch {
      try {
        window.open(url, '_blank');
      } catch {
        // The browser may block both download mechanisms.
      }
    }
  };

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
                    {/* Hide external avatar; we render avatar inside the message bubble */}
                    <div className="hidden" />
                    
                    {/* Message Bubble */}
                    <div className="flex flex-col items-start flex-1 min-w-0">
                      {/* Only show text bubble if it's not an image file (images are shown separately) */}
                      {!(m.isFile && m.isImage) && (
                        <div className={`rounded-sm border-l-4 px-4 py-3 w-full ${
                          isSelf 
                            ? 'bg-yellow-100/90 border border-yellow-300' 
                            : 'bg-zinc-200 border border-gray-500'
                        }`}>
                          {/* Inline header with avatar, name and time inside the bubble */}
                          <div className="flex items-center gap-2 mb-2">
                            <img
                              src={m.avatar || '/avatars/avatar-1.png'}
                              alt={m.author}
                              className="w-7 h-7 rounded-full object-cover"
                              onError={(e) => { e.target.src = '/avatars/avatar-1.png'; }}
                            />
                            <span className="font-semibold text-gray-800 text-sm">{m.author}</span>
                            <span className="text-xs text-gray-500">{formatTime(m.createdAt)}</span>
                          </div>
                          <div 
                            className="whitespace-pre-wrap break-words text-sm text-gray-800 text-left"
                            style={
                              shouldClampMessage(m.text) && !expandedMessageIds[m.id]
                                ? {
                                    maxHeight: '22.5rem',
                                    overflow: 'hidden',
                                  }
                                : {}
                            }
                          >
                            {typeof m.text === 'string' ? m.text : (m.text ? String(m.text) : '')}
                          </div>
                          {shouldClampMessage(m.text) && (
                            <button
                              onClick={() => toggleExpand(m.id)}
                              className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              {expandedMessageIds[m.id] ? 'Show less' : 'Show more'}
                            </button>
                          )}
                        </div>
                      )}
                      
                      {/* Images with inline header */}
                      {Array.isArray(m.images) && m.images.length > 0 && (
                        <div className="mt-2 w-full">
                          <div className={`rounded-sm border-l-4 px-4 py-2 w-full ${
                            isSelf
                              ? 'bg-yellow-50 border-yellow-400 border border-yellow-300'
                              : 'bg-gray-100 border-black/70 border border-gray-300'
                          }`}>
                            <div className="flex items-center gap-2 mb-2">
                              <img
                                src={m.avatar || '/avatars/avatar-1.png'}
                                alt={m.author}
                                className="w-7 h-7 rounded-full object-cover"
                                onError={(e) => { e.target.src = '/avatars/avatar-1.png'; }}
                              />
                              <span className="font-semibold text-gray-800 text-sm">{m.author}</span>
                              <span className="text-xs text-gray-500">{formatTime(m.createdAt)}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 max-w-full">
                          {m.images.map((img, i) => {
                            // Get presigned URL if img is a fileKey
                            const imageUrl = img.startsWith('http') ? img : (presignedUrls[img] || img);
                            const downloadUrl = img.startsWith('http') ? img : (presignedUrls[img] || null);
                            
                            return (
                              <div key={i} className="rounded-lg overflow-hidden bg-gray-200 relative group">
                                <img src={imageUrl} alt="attachment" className="w-full h-auto object-cover" onError={(e) => {
                                  e.target.style.display = 'none';
                                }} />
                                {downloadUrl && (
                                  <button
                                    onClick={() => downloadFile(downloadUrl, `image-${i + 1}`)}
                                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Download"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M5 20h14a2 2 0 002-2v-1M7 20a2 2 0 01-2-2v-1" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            );
                          })}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* File download link for non-image files with inline header */}
                      {m.isFile && !m.isImage && (m.fileKey || m.fileUrl) && (() => {
                        const fileKey = m.fileKey || m.fileUrl;
                        const downloadUrl = fileKey.startsWith('http') ? fileKey : (presignedUrls[fileKey] || null);
                        
                        if (!downloadUrl) return null; // Wait for presigned URL to load
                        
                        return (
                          <div className="mt-2 w-full">
                            <div className={`rounded-sm border-l-4 px-4 py-3 w-full ${
                              isSelf 
                                ? 'bg-yellow-100/90 border-yellow-400 border border-yellow-300' 
                                : 'bg-gray-200 border-black/70 border border-gray-300'
                            }`}>
                              <div className="flex items-center gap-2 mb-2">
                                <img
                                  src={m.avatar || '/avatars/avatar-1.png'}
                                  alt={m.author}
                                  className="w-7 h-7 rounded-full object-cover"
                                  onError={(e) => { e.target.src = '/avatars/avatar-1.png'; }}
                                />
                                <span className="font-semibold text-gray-800 text-sm">{m.author}</span>
                                <span className="text-xs text-gray-500">{formatTime(m.createdAt)}</span>
                              </div>
                              <button
                                onClick={() => downloadFile(downloadUrl, m.fileName || 'file')}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg text-blue-700 transition-colors"
                                title="Download"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span className="text-sm font-medium">{m.fileName || 'Download file'}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })()}
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

      {/* Composer - Mobile Design */}
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
                      // Revoke object URL when removing
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
    </div>
  );
};

export default ChatRoom;
