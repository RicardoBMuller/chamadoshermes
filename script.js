// Aguarda o DOM (a página HTML) ser totalmente carregado
document.addEventListener('DOMContentLoaded', () => {

    // --- PASSO 1: CONEXÃO COM O SUPABASE ---
    // ▼▼▼▼▼▼▼▼▼ COLE SUAS CHAVES AQUI ▼▼▼▼▼▼▼▼▼
    const SUPABASE_URL = 'https://jhgvctjqquwwsfgbyflu.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoZ3ZjdGpxcXV3d3NmZ2J5Zmx1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyODc0NzAsImV4cCI6MjA3Nzg2MzQ3MH0.eqdFgSlROxu_WHM-iCSHC_MBShK4Dv-hw9JkVF-kFIk';
    // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);


    // --- Seletores do DOM ---
    const taskContainers = document.querySelectorAll('.tasks-container');
    const addTaskBtn = document.getElementById('add-task-btn'); 

    // Seletores de Navegação, Busca e Sidebar
    const menuItems = document.querySelectorAll('.menu-item');
    const pages = document.querySelectorAll('.page');
    const searchBar = document.getElementById('search-bar');
    const sidebarToggleBtn = document.getElementById('sidebar-toggle-btn'); 

    // --- Seletores do Modal de Tarefa (Modal 1) ---
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

    // --- Seletores do Modal de Reabertura (Modal 2) ---
    const reopenModal = document.getElementById('reopen-modal');
    const reopenModalCloseBtn = document.getElementById('reopen-modal-close-btn');
    const reopenConfirmBtn = document.getElementById('reopen-confirm-btn');
    const reopenCancelBtn = document.getElementById('reopen-cancel-btn');
    const reopenModalCreatedAt = document.getElementById('reopen-modal-created-at');

    // --- Seletores do Modal de Conclusão (Modal 3) ---
    const confirmDoneModal = document.getElementById('confirm-done-modal');
    const confirmDoneModalCloseBtn = document.getElementById('confirm-done-modal-close-btn');
    const confirmDoneConfirmBtn = document.getElementById('confirm-done-confirm-btn');
    const confirmDoneCancelBtn = document.getElementById('confirm-done-cancel-btn');
    const confirmDoneModalCreatedAt = document.getElementById('confirm-done-modal-created-at');
    const confirmDoneModalReopenedAt = document.getElementById('confirm-done-modal-reopened-at');
    
    let currentEditingCard = null; 
    let cardToReopen = null;       
    let cardToMove = null;
    let draggedCardId = null; // ★★★ NOVO: Variável para guardar o ID do card arrastado ★★★
    
    
    // --- LÓGICA DO SIDEBAR ---
    sidebarToggleBtn.addEventListener('click', () => {
        // Lógica de expandir/recolher
        document.body.classList.toggle('sidebar-expanded');
    });


    // --- LÓGICA DE NAVEGAÇÃO ---
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
        });
    });

    // --- LÓGICA DE BUSCA ---
    searchBar.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const allCards = document.querySelectorAll('.task-card');

        allCards.forEach(card => {
            const title = card.querySelector('h4')?.textContent.toLowerCase() || '';
            const description = card.querySelector('.task-description')?.textContent.toLowerCase() || '';
            const analyst = card.querySelector('.task-analyst')?.textContent.toLowerCase() || '';
            const cardText = title + description + analyst;
            
            if (cardText.includes(searchTerm)) {
                card.classList.remove('hidden');
            } else {
                card.classList.add('hidden');
            }
        });
    });

    // --- Função de Formatação de Data ---
    const formatFullDate = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('pt-BR', { 
            dateStyle: 'long', 
            timeStyle: 'short'
        }).format(date);
    };

    // --- Funções do Modal de TAREFA (Modal 1) ---
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

    // --- Funções do Modal de REABERTURA (Modal 2) ---
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
    
    // --- Funções do Modal de CONCLUSÃO (Modal 3) ---
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
        // ★★★ CORREÇÃO: Não recarrega tudo ao cancelar, apenas remove a classe 'dragging' ★★★
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
            await loadAllTasks(); // Recarrega para mostrar o card travado
        }
    };

    // --- Função de Criação de Card ---
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

    // --- Função Principal: Carregar Tarefas ---
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

    // --- Lógica do Formulário (Salvar/Atualizar) ---
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

    // --- Lógica de Excluir Tarefa ---
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

    // --- ★★★ Lógica de Listeners dos Cards (Drag-and-Drop CORRIGIDA) ★★★ ---
    function addCardListeners(card) {
        card.addEventListener('click', () => {
            if (card.classList.contains('is-done')) {
                openReopenModal(card);
            } else {
                openModal(card);
            }
        });
        
        // ★★★ CORREÇÃO: Usando dataTransfer ★★★
        card.addEventListener('dragstart', (e) => {
            if (card.classList.contains('is-done')) {
                e.preventDefault(); // Não permite arrastar cards concluídos
                return false;
            }
            // Guarda o ID do card que está sendo arrastado
            e.dataTransfer.setData('text/plain', card.dataset.taskId); 
            // Guarda o ID numa variável global para o 'drop'
            draggedCardId = card.dataset.taskId; 
            
            // Adiciona a classe 'dragging' um pouco depois para evitar bugs visuais
            setTimeout(() => {
                card.classList.add('dragging');
                document.body.classList.add('is-dragging'); // ★★★ Ativa o "modo fantasma" ★★★
            }, 0);
        });

        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
            draggedCardId = null; // Limpa o ID
            document.body.classList.remove('is-dragging'); // ★★★ Desativa o "modo fantasma" ★★★
        });
    }

    // --- Lógica de Drop (Drag-and-Drop CORRIGIDA) ---
    // ★★★ Listeners agora são nas COLUNAS, não nos containers ★★★
    document.querySelectorAll('.kanban-column').forEach(column => {
        
        column.addEventListener('dragover', (e) => {
            e.preventDefault(); // Necessário para permitir o drop
            
            // Apenas mostra o 'drag-over' se o container não for o de origem
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
            
            if (!draggedCardId) return; // Se nenhum card estiver sendo arrastado, sai
            
            const draggingCard = document.querySelector(`.task-card[data-task-id="${draggedCardId}"]`);
            if (!draggingCard) return; // Se não encontrar o card, sai
            
            const taskId = draggedCardId;
            const tasksContainer = column.querySelector('.tasks-container'); // Encontra o container *dentro* da coluna
            
            if (!tasksContainer) return; // Se não houver container, não faz nada
            
            const newStatus = tasksContainer.id; // O ID está no container
            const oldContainer = draggingCard.closest('.tasks-container');
            
            if (oldContainer.id === newStatus) {
                return; // Soltou na mesma coluna
            }

            // Se for para "Concluído", abre o modal
            if (newStatus === 'done') {
                openConfirmDoneModal(draggingCard);
                return; 
            }

            // Se for para qualquer outra coluna
            tasksContainer.appendChild(draggingCard); // Move o card no DOM
            draggingCard.classList.remove('is-done'); 
            
            // ★★★ CORREÇÃO DO BUG: Atualiza APENAS o status ★★★
            const { error } = await supabaseClient
                .from('tasks')
                .update({ status: newStatus }) // Não mexe no 'reopened_at'
                .eq('id', taskId);

            if (error) {
                console.error('Erro ao atualizar status (drop):', error.message);
                alert('Erro ao mover o card. A página será recarregada.');
                await loadAllTasks();
            }
            // A tag de reabertura persiste
        });
    });
    // ★★★ FIM DAS CORREÇÕES DE DRAG-AND-DROP ★★★

    // --- Event Listeners dos Modais ---
    // Modal 1
    addTaskBtn.addEventListener('click', () => openModal(null));
    modalCloseBtn.addEventListener('click', closeModal);
    taskModal.addEventListener('click', (e) => {
        if (e.target === taskModal) closeModal();
    });
    // Modal 2
    reopenConfirmBtn.addEventListener('click', handleReopenConfirm);
    reopenCancelBtn.addEventListener('click', closeReopenModal);
    reopenModalCloseBtn.addEventListener('click', closeReopenModal);
    reopenModal.addEventListener('click', (e) => {
        if (e.target === reopenModal) closeReopenModal();
    });
    // Modal 3
    confirmDoneConfirmBtn.addEventListener('click', handleConfirmDone);
    confirmDoneCancelBtn.addEventListener('click', closeConfirmDoneModal);
    confirmDoneModalCloseBtn.addEventListener('click', closeConfirmDoneModal);
    confirmDoneModal.addEventListener('click', (e) => {
        if (e.target === confirmDoneModal) closeConfirmDoneModal();
    });

    // --- CARGA INICIAL ---
    loadAllTasks();

});