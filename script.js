// Aguarda o DOM (a página HTML) ser totalmente carregado
document.addEventListener('DOMContentLoaded', () => {

    // --- PASSO 1: CONEXÃO COM O SUPABASE ---
    // ▼▼▼▼▼▼▼▼▼ COLE SUAS CHAVES AQUI ▼▼▼▼▼▼▼▼▼
    const SUPABASE_URL = 'https://jhgvctjqquwwsfgbyflu.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoZ3ZjdGpxcXV3d3NmZ2J5Zmx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyODc0NzAsImV4cCI6MjA3Nzg2MzQ3MH0.eqdFgSlROxu_WHM-iCSHC_MBShK4Dv-hw9JkVF-kFIk';
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);


    // --- 1. SELETORES DO DOM ---
    const taskContainers = document.querySelectorAll('.tasks-container');
    const addTaskBtn = document.getElementById('add-task-btn'); 
    const kanbanColumns = document.querySelectorAll('.kanban-column'); 

    // Navegação, Busca e Sidebar
    const menuItems = document.querySelectorAll('.menu-item');
    const pages = document.querySelectorAll('.page');
    const searchBar = document.getElementById('search-bar');
    const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn'); 

    // Modal de Tarefa (Modal 1)
    const taskModal = document.getElementById('task-modal');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const taskForm = document.getElementById('task-form');
    const modalTitle = document.getElementById('modal-title');
    const taskIdInput = document.getElementById('task-id-input');
    const taskTitleInput = document.getElementById('task-title-input');
    const taskAnalystInput = document.getElementById('task-analyst-input');
    const taskPriorityInput = document.getElementById('task-priority-input');
    const taskDescriptionInput = document.getElementById('task-description-input');
    const deleteTaskBtn = document.getElementById('delete-task-btn');
    const modalCreatedAt = document.getElementById('modal-created-at');
    const modalReopenedAt = document.getElementById('modal-reopened-at');

    // Modal de Reabertura (Modal 2)
    const reopenModal = document.getElementById('reopen-modal');
    const reopenModalCloseBtn = document.getElementById('reopen-modal-close-btn');
    const reopenConfirmBtn = document.getElementById('reopen-confirm-btn');
    const reopenCancelBtn = document.getElementById('reopen-cancel-btn');
    const reopenModalCreatedAt = document.getElementById('reopen-modal-created-at');

    // Modal de Conclusão (Modal 3)
    const confirmDoneModal = document.getElementById('confirm-done-modal');
    const confirmDoneModalCloseBtn = document.getElementById('confirm-done-modal-close-btn');
    const confirmDoneConfirmBtn = document.getElementById('confirm-done-confirm-btn');
    const confirmDoneCancelBtn = document.getElementById('confirm-done-cancel-btn');
    const confirmDoneModalCreatedAt = document.getElementById('confirm-done-modal-created-at');
    const confirmDoneModalReopenedAt = document.getElementById('confirm-done-modal-reopened-at');
    
    // Seletores de Documentação (Modal 4)
    const addDocumentBtn = document.getElementById('add-document-btn');
    const docGrid = document.getElementById('doc-grid');
    const docEditorOverlay = document.getElementById('doc-editor-overlay');
    const docIdInput = document.getElementById('doc-id-input');
    const docTitleInput = document.getElementById('doc-title-input');
    const docDescriptionInput = document.getElementById('doc-description-input');
    const docSaveBtn = document.getElementById('doc-save-btn');
    const docCloseBtn = document.getElementById('doc-close-btn');
    const docDeleteBtn = document.getElementById('doc-delete-btn');
    
    // --- 2. VARIÁVEIS DE ESTADO ---
    let currentEditingCard = null; 
    let cardToReopen = null;       
    let cardToMove = null;
    let draggedCardId = null; 
    let quill = null; // Editor de texto
    
    
    // --- 3. FUNÇÕES DE FORMATAÇÃO E UTILIDADE ---
    const formatFullDate = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('pt-BR', { 
            dateStyle: 'long', 
            timeStyle: 'short'
        }).format(date);
    };

    function filterKanbanCards(searchTerm) {
        const allCards = document.querySelectorAll('.task-card');
        allCards.forEach(card => {
            const title = card.querySelector('h4')?.textContent.toLowerCase() || '';
            const description = card.querySelector('.task-description')?.textContent.toLowerCase() || '';
            const analyst = card.querySelector('.task-analyst')?.textContent.toLowerCase() || '';
            const cardText = title + description + analyst;
            card.classList.toggle('hidden', !cardText.includes(searchTerm));
        });
    }

    function filterDocCards(searchTerm) {
        const allDocCards = document.querySelectorAll('.doc-card');
        allDocCards.forEach(card => {
            const title = card.querySelector('h4')?.textContent.toLowerCase() || '';
            const description = card.querySelector('p')?.textContent.toLowerCase() || '';
            const cardText = title + description;
            card.classList.toggle('hidden', !cardText.includes(searchTerm));
        });
    }


    // --- 4. FUNÇÕES DE MODAIS (KANBAN) ---
    const openModal = (card = null) => {
        currentEditingCard = card; 
        modalCreatedAt.innerHTML = '';
        modalReopenedAt.innerHTML = '';
        if (card) {
            modalTitle.textContent = 'Editar Chamado';
            taskIdInput.value = card.dataset.taskId; 
            taskTitleInput.value = card.querySelector('h4').textContent;
            taskDescriptionInput.value = card.querySelector('.task-description').textContent;
            taskAnalystInput.value = card.querySelector('.task-analyst').textContent;
            taskPriorityInput.value = card.dataset.priority || 'medium';
            deleteTaskBtn.style.display = 'block';
            modalCreatedAt.innerHTML = `<span class="material-icons-outlined">calendar_today</span> <span>Criado em: ${formatFullDate(card.dataset.createdAt)}</span>`;
            if (card.dataset.reopenedAt) {
                modalReopenedAt.innerHTML = `<span class="material-icons-outlined">history</span> <span>Reaberto em: ${formatFullDate(card.dataset.reopenedAt)}</span>`;
            }
        } else {
            modalTitle.textContent = 'Adicionar Novo Chamado';
            taskForm.reset(); 
            taskIdInput.value = ''; 
            taskPriorityInput.value = 'medium'; 
            deleteTaskBtn.style.display = 'none'; 
        }
        taskModal.classList.add('show'); 
    };
    const closeModal = () => {
        taskModal.classList.remove('show');
        currentEditingCard = null;
        modalCreatedAt.innerHTML = '';
        modalReopenedAt.innerHTML = '';
    };

    const openReopenModal = (card) => {
        cardToReopen = card; 
        reopenModalCreatedAt.innerHTML = `<span class="material-icons-outlined">calendar_today</span> <span>Criado em: ${formatFullDate(card.dataset.createdAt)}</span>`;
        reopenModal.classList.add('show');
    };
    const closeReopenModal = () => {
        reopenModal.classList.remove('show');
        cardToReopen = null;
        reopenModalCreatedAt.innerHTML = ''; 
    };
    const handleReopenConfirm = async () => {
        if (!cardToReopen) return;
        const taskId = cardToReopen.dataset.taskId;
        const now = new Date().toISOString(); 
        const { error } = await supabaseClient
            .from('tasks')
            .update({ status: 'in-progress', reopened_at: now })
            .eq('id', taskId);
        if (error) {
            console.error('Erro ao reabrir chamado:', error.message);
            alert('Erro ao reabrir o chamado.');
        } else {
            closeReopenModal();
            await loadAllTasks(); 
        }
    };
    
    const openConfirmDoneModal = (card) => {
        cardToMove = card; 
        confirmDoneModalCreatedAt.innerHTML = `<span class="material-icons-outlined">calendar_today</span> <span>Criado em: ${formatFullDate(card.dataset.createdAt)}</span>`;
        if (card.dataset.reopenedAt) {
            confirmDoneModalReopenedAt.innerHTML = `<span class="material-icons-outlined">history</span> <span>Reaberto em: ${formatFullDate(card.dataset.reopenedAt)}</span>`;
        } else {
            confirmDoneModalReopenedAt.innerHTML = '';
        }
        confirmDoneModal.classList.add('show');
    };
    const closeConfirmDoneModal = () => {
        confirmDoneModal.classList.remove('show');
        cardToMove = null;
        confirmDoneModalCreatedAt.innerHTML = '';
        confirmDoneModalReopenedAt.innerHTML = '';
        const draggingCard = document.querySelector('.task-card.dragging');
        if (draggingCard) {
            draggingCard.classList.remove('dragging');
        }
    };
    const handleConfirmDone = async () => {
        if (!cardToMove) return;
        const taskId = cardToMove.dataset.taskId;
        const { error } = await supabaseClient
            .from('tasks')
            .update({ status: 'done', reopened_at: null })
            .eq('id', taskId);
        if (error) {
            console.error('Erro ao concluir chamado:', error.message);
            alert('Erro ao concluir o chamado.');
        } else {
            confirmDoneModal.classList.remove('show'); 
            cardToMove = null;
            confirmDoneModalCreatedAt.innerHTML = '';
            confirmDoneModalReopenedAt.innerHTML = '';
            await loadAllTasks(); 
        }
    };


    // --- 5. FUNÇÕES DE DADOS (KANBAN) ---
    const createTaskCard = (task) => {
        const card = document.createElement('div');
        card.className = 'task-card';
        card.draggable = true; 
        card.dataset.taskId = task.id; 
        card.dataset.priority = task.priority;
        card.dataset.createdAt = task.created_at;
        if (task.reopened_at) {
            card.dataset.reopenedAt = task.reopened_at;
        }
        const priorityText = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
        const createdDate = new Date(task.created_at);
        const formattedCreatedDate = new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        }).format(createdDate);
        let reopenedTagHtml = ''; 
        if (task.reopened_at) {
            reopenedTagHtml = `
                <div class="task-reopened-tag">
                    <span class="material-icons-outlined">history</span>
                    <span>Reaberto</span>
                </div>
            `;
        }
        card.innerHTML = `
            <h4>${task.title}</h4>
            <p class="task-description">${task.description || ''}</p>
            ${reopenedTagHtml}
            <div class="task-footer">
                <span class="task-analyst">${task.analyst || 'Aguardando'}</span>
                <span class="task-priority ${task.priority}">${priorityText}</span>
            </div>
            <div class="task-timestamp">
                <span class="material-icons-outlined">calendar_today</span>
                <span>Criado em: ${formattedCreatedDate}</span>
            </div>
        `;
        if (task.status === 'done') {
            card.classList.add('is-done');
        }
        addCardListeners(card);
        return card;
    };

    async function loadAllTasks() {
        taskContainers.forEach(container => container.innerHTML = '');
        const { data: tasks, error } = await supabaseClient
            .from('tasks') 
            .select('*')
            .order('created_at', { ascending: false }); 
        if (error) {
            console.error('Erro ao carregar tarefas:', error.message);
            alert('Não foi possível carregar os chamados.');
            return;
        }
        tasks.forEach(task => {
            const cardElement = createTaskCard(task);
            const column = document.getElementById(task.status); 
            if (column) {
                column.appendChild(cardElement);
            } else {
                console.warn(`Coluna não encontrada para o status: ${task.status}. Movendo para 'in-progress'.`);
                document.getElementById('in-progress').appendChild(cardElement); 
            }
        });
    }

    
    // --- 6. FUNÇÕES DE DADOS (DOCUMENTAÇÃO) ---
    function initializeQuill() {
        if (!quill) {
            quill = new Quill('#quill-editor', {
                modules: {
                    toolbar: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        ['link', 'image', 'code-block'],
                        ['clean']
                    ]
                },
                theme: 'snow'
            });
        }
    }

    async function loadAllDocuments() {
        docGrid.innerHTML = 'Carregando documentos...';
        const { data, error } = await supabaseClient
            .from('documentation')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Erro ao carregar documentos:', error.message);
            docGrid.innerHTML = 'Erro ao carregar documentos.';
            return;
        }
        if (data.length === 0) {
            docGrid.innerHTML = 'Nenhum documento encontrado. Clique em "Novo Documento" para criar um.';
            return;
        }
        docGrid.innerHTML = '';
        data.forEach(doc => {
            docGrid.appendChild(createDocumentCard(doc));
        });
    }

    function createDocumentCard(doc) {
        const card = document.createElement('div');
        card.className = 'doc-card';
        card.dataset.docId = doc.id;
        card.dataset.title = doc.title;
        card.dataset.description = doc.description;
        card.dataset.content = btoa(unescape(encodeURIComponent(doc.content))); 

        let thumbnailHtml = '';
        const parser = new DOMParser();
        const htmlDoc = parser.parseFromString(doc.content, 'text/html');
        const firstImage = htmlDoc.querySelector('img');
        
        if (firstImage && firstImage.src) {
            thumbnailHtml = `
                <div class="doc-card-thumbnail">
                    <img src="${firstImage.src}" alt="Preview">
                </div>
            `;
        } else {
            thumbnailHtml = `
                <div class="doc-card-placeholder">
                    <span class="material-icons-outlined">article</span>
                </div>
            `;
        }

        card.innerHTML = `
            ${thumbnailHtml}
            <div class="doc-card-content">
                <h4>${doc.title}</h4>
                <p>${doc.description || 'Sem descrição'}</p>
            </div>
        `;
        
        card.addEventListener('click', () => {
            const docData = {
                id: card.dataset.docId,
                title: card.dataset.title,
                description: card.dataset.description,
                content: decodeURIComponent(escape(atob(card.dataset.content)))
            };
            openDocumentEditor(docData);
        });
        
        return card;
    }

    function openDocumentEditor(doc = null) {
        initializeQuill();
        if (doc) {
            docIdInput.value = doc.id;
            docTitleInput.value = doc.title;
            docDescriptionInput.value = doc.description;
            quill.root.innerHTML = doc.content; 
            docDeleteBtn.style.display = 'flex'; 
        } else {
            docIdInput.value = ''; 
            docTitleInput.value = '';
            docDescriptionInput.value = '';
            quill.root.innerHTML = ''; 
            docDeleteBtn.style.display = 'none'; 
        }
        docEditorOverlay.classList.add('show');
    }

    function closeDocumentEditor() {
        docEditorOverlay.classList.remove('show');
    }

    async function saveDocument() {
        const id = docIdInput.value || undefined; 
        const title = docTitleInput.value;
        const description = docDescriptionInput.value;
        const content = quill.root.innerHTML; 

        if (!title) {
            alert('Por favor, insira um título.');
            return;
        }

        const { error } = await supabaseClient
            .from('documentation')
            .upsert({
                id: id,
                title: title,
                description: description,
                content: content,
                updated_at: new Date().toISOString() 
            });

        if (error) {
            console.error('Erro ao salvar documento:', error.message);
            alert('Erro ao salvar o documento.');
        } else {
            closeDocumentEditor();
            loadAllDocuments(); 
        }
    }

    async function deleteDocument() {
        const id = docIdInput.value;
        if (!id) return;
        
        if (confirm('Tem certeza que deseja excluir este documento permanentemente?')) {
            const { error } = await supabaseClient
                .from('documentation')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Erro ao excluir documento:', error.message);
                alert('Erro ao excluir o documento.');
            } else {
                closeDocumentEditor();
                loadAllDocuments();
            }
        }
    }


    // --- 7. EVENT LISTENERS ---

    // Sidebar e Navegação
    sidebarToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('sidebar-expanded');
    });

    menuItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            menuItems.forEach(i => i.classList.remove('active'));
            pages.forEach(p => p.classList.remove('active'));
            item.classList.add('active');
            const pageId = item.dataset.page;
            const targetPage = document.getElementById(pageId + '-page');
            if (targetPage) {
                targetPage.classList.add('active');
            }
            if (pageId === 'documentacao') {
                loadAllDocuments();
            }
        });
    });

    searchBar.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const activePage = document.querySelector('.page.active').id;
        if (activePage === 'chamados-page') {
            filterKanbanCards(searchTerm);
        } else if (activePage === 'documentacao-page') {
            filterDocCards(searchTerm);
        }
    });

    // Listeners do Drag-and-Drop (Kanban)
    function addCardListeners(card) {
        card.addEventListener('click', () => {
            if (card.classList.contains('is-done')) {
                openReopenModal(card);
            } else {
                openModal(card);
            }
        });
        
        card.addEventListener('dragstart', (e) => {
            if (card.classList.contains('is-done')) {
                e.preventDefault();
                return false;
            }
            e.dataTransfer.setData('text/plain', card.dataset.taskId); 
            draggedCardId = card.dataset.taskId; 
            
            setTimeout(() => {
                card.classList.add('dragging');
                document.body.classList.add('is-dragging'); 
            }, 0);
        });

        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
            draggedCardId = null; 
            document.body.classList.remove('is-dragging'); 
        });
    }

    kanbanColumns.forEach(column => {
        
        column.addEventListener('dragover', (e) => {
            e.preventDefault(); 
            const draggingCard = document.querySelector('.task-card.dragging');
            if (draggingCard && draggingCard.closest('.kanban-column') !== column) {
                column.classList.add('drag-over'); 
            }
        });
        
        column.addEventListener('dragleave', () => {
            column.classList.remove('drag-over');
        });
        
        column.addEventListener('drop', async (e) => {
            e.preventDefault();
            column.classList.remove('drag-over');
            
            if (!draggedCardId) return; 
            const draggingCard = document.querySelector(`.task-card[data-task-id="${draggedCardId}"]`);
            if (!draggingCard) return; 
            
            const taskId = draggedCardId;
            const tasksContainer = column.querySelector('.tasks-container');
            if (!tasksContainer) return; 
            
            const newStatus = tasksContainer.id; 
            const oldContainer = draggingCard.closest('.tasks-container');
            
            if (oldContainer.id === newStatus) return;

            if (newStatus === 'done') {
                openConfirmDoneModal(draggingCard);
                return; 
            }

            tasksContainer.appendChild(draggingCard); 
            draggingCard.classList.remove('is-done'); 
            
            const { error } = await supabaseClient
                .from('tasks')
                .update({ status: newStatus }) 
                .eq('id', taskId);

            if (error) {
                console.error('Erro ao atualizar status (drop):', error.message);
                alert('Erro ao mover o card. A página será recarregada.');
                await loadAllTasks();
            }
        });
    });

    // Listeners dos Modais do Kanban
    addTaskBtn.addEventListener('click', () => openModal(null));
    modalCloseBtn.addEventListener('click', closeModal);
    taskModal.addEventListener('click', (e) => {
        if (e.target === taskModal) closeModal();
    });
    taskForm.addEventListener('submit', async (e) => {
        e.preventDefault(); 
        const taskData = {
            title: taskTitleInput.value,
            description: taskDescriptionInput.value,
            analyst: taskAnalystInput.value,
            priority: taskPriorityInput.value,
        };
        if (taskDescriptionInput.value === '') taskData.description = null; 
        let error;
        if (currentEditingCard) {
            const taskId = currentEditingCard.dataset.taskId;
            const { error: updateError } = await supabaseClient
                .from('tasks').update(taskData).eq('id', taskId); 
            error = updateError;
        } else {
            taskData.status = 'in-progress'; 
            const { error: insertError } = await supabaseClient
                .from('tasks').insert(taskData);
            error = insertError;
        }
        if (error) {
            console.error('Erro ao salvar no Supabase:', error.message);
            alert('Erro ao salvar o chamado.');
        } else {
            closeModal();
            await loadAllTasks(); 
        }
    });
    deleteTaskBtn.addEventListener('click', async () => {
        let cardToDelete = currentEditingCard || cardToReopen;
        if (!cardToDelete) return;
        if (confirm('Tem certeza que deseja excluir este chamado PERMANENTEMENTE?')) {
            const taskId = cardToDelete.dataset.taskId;
            const { error } = await supabaseClient
                .from('tasks').delete().eq('id', taskId); 
            if (error) {
                console.error('Erro ao excluir:', error.message);
                alert('Erro ao excluir o chamado.');
            } else {
                cardToDelete.remove(); 
                closeModal(); 
                closeReopenModal();
            }
        }
    });
    reopenConfirmBtn.addEventListener('click', handleReopenConfirm);
    reopenCancelBtn.addEventListener('click', closeReopenModal);
    reopenModalCloseBtn.addEventListener('click', closeReopenModal);
    reopenModal.addEventListener('click', (e) => {
        if (e.target === reopenModal) closeReopenModal();
    });
    confirmDoneConfirmBtn.addEventListener('click', handleConfirmDone);
    confirmDoneCancelBtn.addEventListener('click', closeConfirmDoneModal);
    confirmDoneModalCloseBtn.addEventListener('click', closeConfirmDoneModal);
    confirmDoneModal.addEventListener('click', (e) => {
        if (e.target === confirmDoneModal) closeConfirmDoneModal();
    });

    // Listeners dos Modais de Documentação
    addDocumentBtn.addEventListener('click', () => openDocumentEditor(null));
    docSaveBtn.addEventListener('click', saveDocument);
    docCloseBtn.addEventListener('click', closeDocumentEditor);
    docDeleteBtn.addEventListener('click', deleteDocument);
    // ★★★ CORREÇÃO ADICIONADA: Fechar modal ao clicar fora ★★★
    docEditorOverlay.addEventListener('click', (e) => {
        if (e.target === docEditorOverlay) {
            closeDocumentEditor();
        }
    });


    // --- 8. CARGA INICIAL ---
    loadAllTasks();

});