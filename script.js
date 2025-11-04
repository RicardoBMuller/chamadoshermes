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
            // Modo de Edição
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
            // Modo de Criação
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
    // ★★★ LÓGICA MODIFICADA AQUI (handleReopenConfirm) ★★★
    const handleReopenConfirm = async () => {
        if (!cardToReopen) return;
        const taskId = cardToReopen.dataset.taskId;
        const now = new Date().toISOString(); 

        const { error } = await supabaseClient
            .from('tasks')
            .update({ 
                status: 'in-progress', // MUDANÇA: de 'todo' para 'in-progress'
                reopened_at: now 
            })
            .eq('id', taskId);
        
        if (error) {
            console.error('Erro ao reabrir chamado:', error.message);
            alert('Erro ao reabrir o chamado.');
        } else {
            closeReopenModal();
            await loadAllTasks(); 
        }
    };
    // ★★★ FIM DA MODIFICAÇÃO ★★★
    
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
        loadAllTasks(); 
    };
    const handleConfirmDone = async () => {
        if (!cardToMove) return;
        const taskId = cardToMove.dataset.taskId;

        const { error } = await supabaseClient
            .from('tasks')
            .update({ 
                status: 'done',       
                reopened_at: null  // Limpa a tag de reabertura
            })
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


    // --- Função de Criação de Card (Modificada) ---
    const createTaskCard = (task) => {
        const card = document.createElement('div');
        card.className = 'task-card';
        card.draggable = true; 
        card.dataset.taskId = task.id; 
        card.dataset.priority = task.priority;
        card.dataset.createdAt = task.created_at; // Armazena data de criação
        if (task.reopened_at) {
            card.dataset.reopenedAt = task.reopened_at; // Armazena data de reabertura
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
    // ★★★ LÓGICA MODIFICADA AQUI (loadAllTasks) ★★★
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
                // MUDANÇA: Fallback agora é 'in-progress'
                document.getElementById('in-progress').appendChild(cardElement); 
            }
        });
    }
    // ★★★ FIM DA MODIFICAÇÃO ★★★

    // --- Lógica do Formulário (Salvar/Atualizar) ---
    // ★★★ LÓGICA MODIFICADA AQUI (taskForm submit) ★★★
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
            // Editando card
            const taskId = currentEditingCard.dataset.taskId;
            const { error: updateError } = await supabaseClient
                .from('tasks').update(taskData).eq('id', taskId); 
            error = updateError;
        } else {
            // Criando novo card
            // MUDANÇA: Novo card agora vai para 'in-progress'
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
    // ★★★ FIM DA MODIFICAÇÃO ★★★

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

    // --- Lógica de Listeners dos Cards ---
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
            card.classList.add('dragging');
        });

        card.addEventListener('dragend', () => card.classList.remove('dragging'));
    }

    // --- Lógica de Drop (Drag-and-Drop) ---
    taskContainers.forEach(container => {
        container.addEventListener('dragover', (e) => {
            e.preventDefault(); 
            container.classList.add('drag-over'); 
        });

        container.addEventListener('dragleave', () => container.classList.remove('drag-over'));

        container.addEventListener('drop', async (e) => {
            e.preventDefault();
            container.classList.remove('drag-over');
            
            const draggingCard = document.querySelector('.task-card.dragging');
            if (!draggingCard) return;

            const taskId = draggingCard.dataset.taskId;
            const newStatus = container.id;
            const oldStatus = draggingCard.closest('.tasks-container').id;

            if (newStatus === oldStatus) return;

            if (newStatus === 'done') {
                e.preventDefault(); 
                openConfirmDoneModal(draggingCard);
                return; 
            }

            // Lógica para TODAS AS OUTRAS colunas
            container.appendChild(draggingCard);
            draggingCard.classList.remove('is-done'); 

            // A tag de reabertura persiste
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