document.addEventListener('DOMContentLoaded', function() {
    const webhookUrlInput = document.getElementById('webhook_url');
    const messageInput = document.getElementById('message');
    const charCountSpan = document.getElementById('charCount');
    const sendBtn = document.getElementById('sendBtn');
    const statusDiv = document.getElementById('status');
    const messagePreview = document.getElementById('messagePreview');
    const addEmbedBtn = document.getElementById('addEmbedBtn');
    const embedsContainer = document.getElementById('embedsContainer');
    const messageLinkInput = document.getElementById('messageLink');
    const loadMessageBtn = document.getElementById('loadMessageBtn');

    let embedCount = 0;

    // Event Listeners
    messageInput.addEventListener('input', function() {
        updateCharCount();
        updatePreview();
    });
    webhookUrlInput.addEventListener('input', updatePreview);
    addEmbedBtn.addEventListener('click', addEmbed);
    sendBtn.addEventListener('click', sendWebhook);
    loadMessageBtn.addEventListener('click', function() {
        showStatus('Funcionalidade de carregar mensagem ainda não implementada.', 'info');
    });

    // Initial setup
    updateCharCount();
    updatePreview();

    function updateCharCount() {
        const currentLength = messageInput.value.length;
        charCountSpan.textContent = currentLength;
        if (currentLength > 2000) {
            charCountSpan.style.color = '#ed4245'; // Discord red
        } else {
            charCountSpan.style.color = '#72767d'; // Discord grey
        }
    }

    function addEmbed() {
        embedCount++;
        const embedId = `embed-${embedCount}`;
        const embedHtml = `
            <div class="embed-container mb-4" id="${embedId}">
                <div class="embed-header">
                    <h3>Embed ${embedCount}</h3>
                    <div class="embed-actions">
                        <button type="button" class="btn-action move-up" data-id="${embedId}" title="Move Up"><i class="fas fa-arrow-up"></i></button>
                        <button type="button" class="btn-action move-down" data-id="${embedId}" title="Move Down"><i class="fas fa-arrow-down"></i></button>
                        <button type="button" class="btn-action duplicate" data-id="${embedId}" title="Duplicate"><i class="fas fa-copy"></i></button>
                        <button type="button" class="btn-action delete" data-id="${embedId}" title="Delete"><i class="fas fa-times"></i></button>
                    </div>
                </div>
                <div class="embed-content">
                    <div class="form-group">
                        <label for="${embedId}-title">Título</label>
                        <input type="text" class="form-control embed-title-input" id="${embedId}-title" placeholder="Título do Embed">
                    </div>
                    <div class="form-group">
                        <label for="${embedId}-description">Descrição</label>
                        <textarea class="form-control embed-description-input" id="${embedId}-description" placeholder="Descrição do Embed"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="${embedId}-color">Cor</label>
                        <input type="color" class="form-control embed-color-input" id="${embedId}-color" value="#5865f2">
                    </div>
                    <div class="form-group">
                        <label for="${embedId}-image">URL da Imagem (Banner)</label>
                        <input type="text" class="form-control embed-image-input" id="${embedId}-image" placeholder="URL da imagem">
                    </div>
                </div>
                <div class="embed-preview-wrapper">
                    <h4>Preview do Embed</h4>
                    <div class="embed-preview" id="${embedId}-preview" style="border-left-color: #5865f2;">
                        <div class="embed-title"></div>
                        <div class="embed-description"></div>
                        <img class="embed-image" src="" alt="" style="display: none;">
                    </div>
                </div>
            </div>
        `;
        embedsContainer.insertAdjacentHTML('beforeend', embedHtml);

        const newEmbedElement = document.getElementById(embedId);
        // Add event listeners for new embed inputs
        newEmbedElement.querySelectorAll('input, textarea').forEach(input => {
            input.addEventListener('input', updatePreview);
        });
        // Add event listeners for action buttons
        newEmbedElement.querySelector('.delete').addEventListener('click', deleteEmbed);
        newEmbedElement.querySelector('.duplicate').addEventListener('click', duplicateEmbed);
        newEmbedElement.querySelector('.move-up').addEventListener('click', moveEmbedUp);
        newEmbedElement.querySelector('.move-down').addEventListener('click', moveEmbedDown);

        updatePreview();
    }

    function deleteEmbed(event) {
        const embedId = event.currentTarget.dataset.id;
        document.getElementById(embedId).remove();
        updateEmbedNumbers();
        updatePreview();
    }

    function duplicateEmbed(event) {
        const embedId = event.currentTarget.dataset.id;
        const originalEmbed = document.getElementById(embedId);
        const clone = originalEmbed.cloneNode(true);
        embedsContainer.insertBefore(clone, originalEmbed.nextSibling);
        
        // Re-assign new IDs and add new event listeners for the cloned embed
        embedCount++;
        const newEmbedId = `embed-${embedCount}`;
        clone.id = newEmbedId;
        clone.querySelector('h3').textContent = `Embed ${embedCount}`;
        clone.querySelector('.embed-title-input').id = `${newEmbedId}-title`;
        clone.querySelector('.embed-description-input').id = `${newEmbedId}-description`;
        clone.querySelector('.embed-color-input').id = `${newEmbedId}-color`;
        clone.querySelector('.embed-preview').id = `${newEmbedId}-preview`;

        clone.querySelectorAll('button').forEach(btn => btn.dataset.id = newEmbedId);

        clone.querySelectorAll('input, textarea').forEach(input => {
            input.addEventListener('input', updatePreview);
        });
        clone.querySelector('.delete').addEventListener('click', deleteEmbed);
        clone.querySelector('.duplicate').addEventListener('click', duplicateEmbed);
        clone.querySelector('.move-up').addEventListener('click', moveEmbedUp);
        clone.querySelector('.move-down').addEventListener('click', moveEmbedDown);

        updateEmbedNumbers();
        updatePreview();
    }

    function moveEmbed(embedId, direction) {
        const embedElement = document.getElementById(embedId);
        if (!embedElement) return;

        if (direction === 'up') {
            const previousSibling = embedElement.previousElementSibling;
            if (previousSibling) {
                embedsContainer.insertBefore(embedElement, previousSibling);
            }
        } else if (direction === 'down') {
            const nextSibling = embedElement.nextElementSibling;
            if (nextSibling) {
                embedsContainer.insertBefore(nextSibling, embedElement);
            }
        }
        updateEmbedNumbers();
        updatePreview();
    }

    function moveEmbedUp(event) {
        moveEmbed(event.currentTarget.dataset.id, 'up');
    }

    function moveEmbedDown(event) {
        moveEmbed(event.currentTarget.dataset.id, 'down');
    }

    function updateEmbedNumbers() {
        const currentEmbeds = embedsContainer.querySelectorAll('.embed-container');
        currentEmbeds.forEach((embed, index) => {
            embed.querySelector('h3').textContent = `Embed ${index + 1}`;
            embed.id = `embed-${index + 1}`;
            embed.querySelectorAll('button').forEach(btn => btn.dataset.id = `embed-${index + 1}`);
            embed.querySelector('.embed-title-input').id = `embed-${index + 1}-title`;
            embed.querySelector('.embed-description-input').id = `embed-${index + 1}-description`;
            embed.querySelector('.embed-color-input').id = `embed-${index + 1}-color`;
            embed.querySelector('.embed-preview').id = `embed-${index + 1}-preview`;
        });
        embedCount = currentEmbeds.length;
    }

    function updatePreview() {
        const message = messageInput.value;
        let previewHTML = '';

        // Message content
        if (message) {
            previewHTML += `<div class="message-content">${formatDiscordMessage(message)}</div>`;
        }

        // Embeds preview
        document.querySelectorAll('.embed-container').forEach(embedElement => {
            const title = embedElement.querySelector('.embed-title-input').value;
            const description = embedElement.querySelector('.embed-description-input').value;
            const color = embedElement.querySelector('.embed-color-input').value;
            const imageUrl = embedElement.querySelector('.embed-image-input').value;

            const embedPreviewDiv = embedElement.querySelector('.embed-preview');
            const embedPreviewTitleDiv = embedPreviewDiv.querySelector('.embed-title');
            const embedPreviewDescriptionDiv = embedPreviewDiv.querySelector('.embed-description');
            const embedPreviewImageElement = embedPreviewDiv.querySelector('.embed-image');

            embedPreviewDiv.style.borderLeftColor = color;
            embedPreviewTitleDiv.textContent = title;
            embedPreviewDescriptionDiv.textContent = description;

            if (imageUrl) {
                embedPreviewImageElement.src = imageUrl;
                embedPreviewImageElement.style.display = 'block';
            } else {
                embedPreviewImageElement.src = '';
                embedPreviewImageElement.style.display = 'none';
            }

            if (title || description || imageUrl) {
                previewHTML += `<div class="embed-preview" style="border-left-color: ${color};">`;
                if (title) {
                    previewHTML += `<div class="embed-title">${title}</div>`;
                }
                if (description) {
                    previewHTML += `<div class="embed-description">${formatDiscordMessage(description)}</div>`;
                }
                if (imageUrl) {
                    previewHTML += `<img class="embed-image" src="${imageUrl}" alt="" style="width: 100%; height: auto; margin-top: 10px;">`;
                }
                previewHTML += `</div>`;
            }
        });

        messagePreview.innerHTML = previewHTML || 'Sua mensagem aparecerá aqui...';
    }

    function formatDiscordMessage(text) {
        // Basic Discord markdown formatting
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); // Bold
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');     // Italics
        text = text.replace(/__(.*?)__/g, '<u>$1</u>');     // Underline
        text = text.replace(/~~(.*?)~~/g, '<del>$1</del>');   // Strikethrough
        text = text.replace(/`([^`]+)`/g, '<code>$1</code>'); // Inline code
        text = text.replace(/```([\s\S]*?)```/g, '<pre>$1</pre>'); // Code block
        
        // Basic role/channel/user mention (very simplified, just for visual representation)
        text = text.replace(/<@&(\d+)>/g, '<span class="role-mention">@Role ($1)</span>'); // Role mention
        text = text.replace(/<#(\d+)>/g, '<span class="channel-mention">#channel ($1)</span>'); // Channel mention
        text = text.replace(/<@!?(\d+)>/g, '<span class="user-mention">@User ($1)</span>'); // User mention

        return text;
    }

    async function sendWebhook() {
        const webhookUrl = webhookUrlInput.value.trim();
        const message = messageInput.value.trim();

        if (!webhookUrl || (!message && embedsContainer.children.length === 0)) {
            showStatus('Por favor, preencha a URL do webhook e/ou adicione uma mensagem/embed.', 'error');
            return;
        }

        const embeds = [];
        document.querySelectorAll('.embed-container').forEach(embedElement => {
            const title = embedElement.querySelector('.embed-title-input').value.trim();
            const description = embedElement.querySelector('.embed-description-input').value.trim();
            const color = embedElement.querySelector('.embed-color-input').value;
            const imageUrl = embedElement.querySelector('.embed-image-input').value.trim();

            if (title || description || imageUrl) {
                const embedData = {
                    title: title,
                    description: description,
                    color: parseInt(color.replace('#', ''), 16)
                };
                if (imageUrl) {
                    embedData.image = { url: imageUrl };
                }
                embeds.push(embedData);
            }
        });

        const payload = {
            webhook_url: webhookUrl,
            content: message,
            embeds: embeds
        };
        
        // Remove content if empty and no embeds
        if (!payload.content && payload.embeds.length === 0) {
            showStatus('A mensagem ou embeds não podem estar vazios.', 'error');
            return;
        }

        // If content is empty, remove it from payload to avoid API errors if only embeds are sent
        if (!payload.content) {
            delete payload.content;
        }

        try {
            sendBtn.disabled = true;
            showStatus('Enviando mensagem...', 'info');

            const response = await fetch('/send_webhook', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                showStatus('Mensagem enviada com sucesso!', 'success');
                // Clear inputs after successful send
                messageInput.value = '';
                embedsContainer.innerHTML = ''; // Clear all embeds
                embedCount = 0;
                updateCharCount();
                updatePreview();
            } else {
                showStatus(`Erro: ${data.error}`, 'error');
            }
        } catch (error) {
            showStatus(`Erro ao enviar mensagem: ${error.message}`, 'error');
        } finally {
            sendBtn.disabled = false;
        }
    }

    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = `alert alert-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'info'}`;
    }

    // Handle accordion collapse/expand - no extra JS needed, Bootstrap handles it
    // For preview, we only care about the input values, not the accordion state.
});