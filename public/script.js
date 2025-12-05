const API_URL = window.location.origin + '/api';

let clienteAtual = null;
let usuarioAtual = null;

// Carregar dados ao iniciar
document.addEventListener('DOMContentLoaded', () => {
    verificarAutenticacao();
});

// Verificar se o usuário está autenticado
async function verificarAutenticacao() {
    try {
        const response = await fetch(`${API_URL}/verificar-sessao`, {
            credentials: 'include'
        });
        const data = await response.json();

        if (!data.autenticado) {
            window.location.href = '/login.html';
            return;
        }

        usuarioAtual = data.user;
        document.getElementById('nome-usuario').textContent = data.user.nome;
        
        carregarClientes();
        carregarEstatisticas();
    } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        window.location.href = '/login.html';
    }
}

// Fazer logout
async function fazerLogout() {
    if (!confirm('Deseja sair do sistema?')) {
        return;
    }

    try {
        await fetch(`${API_URL}/logout`, {
            method: 'POST',
            credentials: 'include'
        });
        window.location.href = '/login.html';
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
    }
}

// Carregar estatísticas
async function carregarEstatisticas() {
    try {
        const response = await fetch(`${API_URL}/estatisticas`, {
            credentials: 'include'
        });
        const stats = await response.json();
        
        document.getElementById('stat-total').textContent = stats.total || 0;
        document.getElementById('stat-pendentes').textContent = stats.pendentes || 0;
        document.getElementById('stat-confirmados').textContent = stats.confirmados || 0;
        document.getElementById('stat-concluidos').textContent = stats.concluidos || 0;
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
    }
}

// Carregar clientes
async function carregarClientes() {
    try {
        const busca = document.getElementById('busca').value;
        const filtroCidade = document.getElementById('filtro-cidade').value;

        let url = `${API_URL}/clientes?`;
        if (busca) url += `busca=${encodeURIComponent(busca)}&`;

        const response = await fetch(url, {
            credentials: 'include'
        });

        if (response.status === 401) {
            window.location.href = '/login.html';
            return;
        }

        let clientes = await response.json();

        // Filtrar por cidade no frontend
        if (filtroCidade) {
            clientes = clientes.filter(c => 
                c.cidade && c.cidade.toLowerCase().includes(filtroCidade.toLowerCase())
            );
        }

        renderizarTabela(clientes);
        carregarEstatisticas();
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        mostrarErro('Erro ao carregar dados');
    }
}

// Renderizar tabela
function renderizarTabela(clientes) {
    const tbody = document.getElementById('corpo-tabela');
    
    if (clientes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="11" class="empty">Nenhum cliente encontrado</td></tr>';
        return;
    }

    tbody.innerHTML = clientes.map(cliente => `
        <tr>
            <td>${cliente.sa || '-'}</td>
            <td>${cliente.nome}</td>
            <td>${cliente.telefone || '-'}</td>
            <td>${cliente.endereco || '-'}</td>
            <td>${cliente.tipo_servico || '-'}</td>
            <td>${cliente.micro_terr || '-'}</td>
            <td>${cliente.plano || '-'}</td>
            <td>${cliente.verificador || '-'}</td>
            <td>${cliente.cidade || '-'}</td>
            <td>
                <select class="status-select" onchange="alterarStatus(${cliente.id}, this.value)" data-status="${cliente.status || 'COP'}">
                    <option value="COP" ${(cliente.status || 'COP') === 'COP' ? 'selected' : ''}>COP</option>
                    <option value="WHATS ENVIADO" ${cliente.status === 'WHATS ENVIADO' ? 'selected' : ''}>WHATS ENVIADO</option>
                    <option value="CONFIRMADO" ${cliente.status === 'CONFIRMADO' ? 'selected' : ''}>CONFIRMADO</option>
                    <option value="MANTER AGENDAMENTO" ${cliente.status === 'MANTER AGENDAMENTO' ? 'selected' : ''}>MANTER AGENDAMENTO</option>
                    <option value="INSTALADO" ${cliente.status === 'INSTALADO' ? 'selected' : ''}>INSTALADO</option>
                    <option value="ENCAIXE ENVIADO" ${cliente.status === 'ENCAIXE ENVIADO' ? 'selected' : ''}>ENCAIXE ENVIADO</option>
                </select>
            </td>
            <td>
                <div class="actions">
                    <button class="btn btn-edit" onclick="editarCliente(${cliente.id})">✏️ Editar</button>
                    <button class="btn btn-delete" onclick="deletarCliente(${cliente.id})">🗑️ Excluir</button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Formatar data
function formatarData(data) {
    if (!data) return '-';
    const [ano, mes, dia] = data.split('-');
    return `${dia}/${mes}/${ano}`;
}

// Aplicar filtros
function aplicarFiltros() {
    carregarClientes();
}

// Abrir modal
function abrirModal(id = null) {
    const modal = document.getElementById('modal');
    const title = document.getElementById('modal-title');
    const form = document.getElementById('form-cliente');
    
    form.reset();
    clienteAtual = id;
    
    if (id) {
        title.textContent = 'Editar Cliente';
        carregarClienteParaEdicao(id);
    } else {
        title.textContent = 'Novo Cliente';
    }
    
    modal.classList.add('show');
}

// Fechar modal
function fecharModal() {
    const modal = document.getElementById('modal');
    modal.classList.remove('show');
    clienteAtual = null;
}

// Carregar cliente para edição
async function carregarClienteParaEdicao(id) {
    try {
        const response = await fetch(`${API_URL}/clientes/${id}`, {
            credentials: 'include'
        });
        const cliente = await response.json();
        
        document.getElementById('cliente-id').value = cliente.id;
        document.getElementById('sa').value = cliente.sa || '';
        document.getElementById('nome').value = cliente.nome;
        document.getElementById('telefone').value = cliente.telefone || '';
        document.getElementById('endereco').value = cliente.endereco || '';
        document.getElementById('tipo-servico').value = cliente.tipo_servico || '';
        document.getElementById('micro-terr').value = cliente.micro_terr || '';
        document.getElementById('plano').value = cliente.plano || '';
        document.getElementById('verificador').value = cliente.verificador || '';
        document.getElementById('cidade').value = cliente.cidade || '';
    } catch (error) {
        console.error('Erro ao carregar cliente:', error);
        mostrarErro('Erro ao carregar dados do cliente');
    }
}

// Salvar cliente
async function salvarCliente(event) {
    event.preventDefault();
    
    const id = document.getElementById('cliente-id').value;
    const dados = {
        sa: document.getElementById('sa').value,
        nome: document.getElementById('nome').value,
        telefone: document.getElementById('telefone').value,
        endereco: document.getElementById('endereco').value,
        tipo_servico: document.getElementById('tipo-servico').value,
        micro_terr: document.getElementById('micro-terr').value,
        plano: document.getElementById('plano').value,
        verificador: document.getElementById('verificador').value,
        cidade: document.getElementById('cidade').value
    };

    try {
        let response;
        if (id) {
            // Atualizar
            response = await fetch(`${API_URL}/clientes/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(dados)
            });
        } else {
            // Criar
            response = await fetch(`${API_URL}/clientes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(dados)
            });
        }

        if (response.ok) {
            fecharModal();
            carregarClientes();
            mostrarSucesso(id ? 'Cliente atualizado com sucesso!' : 'Cliente criado com sucesso!');
        } else {
            const error = await response.json();
            mostrarErro(error.error || 'Erro ao salvar cliente');
        }
    } catch (error) {
        console.error('Erro ao salvar cliente:', error);
        mostrarErro('Erro ao salvar cliente');
    }
}

// Editar cliente
function editarCliente(id) {
    abrirModal(id);
}

// Deletar cliente
async function deletarCliente(id) {
    if (!confirm('Tem certeza que deseja excluir este cliente?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URL}/clientes/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });

        if (response.ok) {
            carregarClientes();
            mostrarSucesso('Cliente excluído com sucesso!');
        } else {
            const error = await response.json();
            mostrarErro(error.error || 'Erro ao excluir cliente');
        }
    } catch (error) {
        console.error('Erro ao excluir cliente:', error);
        mostrarErro('Erro ao excluir cliente');
    }
}

// Mensagens de feedback
function mostrarSucesso(mensagem) {
    alert(mensagem); // Pode ser substituído por uma notificação mais elegante
}

function mostrarErro(mensagem) {
    alert('Erro: ' + mensagem); // Pode ser substituído por uma notificação mais elegante
}

// Fechar modal ao clicar fora
window.onclick = function(event) {
    const modal = document.getElementById('modal');
    if (event.target === modal) {
        fecharModal();
    }
}

// Atalho ESC para fechar modal
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        fecharModal();
    }
});

// Importar dados da planilha do Google Sheets
async function importarPlanilha() {
    if (!confirm('Deseja importar os dados da planilha do Google Sheets?\n\nIsso irá adicionar os dados da planilha ao banco de dados existente.')) {
        return;
    }

    try {
        const btn = event.target;
        const textoOriginal = btn.textContent;
        btn.disabled = true;
        btn.textContent = '⏳ Importando...';

        const response = await fetch(`${API_URL}/importar-planilha`, {
            method: 'POST',
            credentials: 'include'
        });

        const resultado = await response.json();

        if (response.ok) {
            carregarClientes();
            alert(`✅ Importação concluída!\n\n` +
                  `Total de registros: ${resultado.total}\n` +
                  `Importados com sucesso: ${resultado.importados}\n` +
                  `Erros: ${resultado.erros}`);
        } else {
            alert('❌ Erro: ' + resultado.error);
        }

        btn.disabled = false;
        btn.textContent = textoOriginal;
    } catch (error) {
        console.error('Erro ao importar planilha:', error);
        alert('❌ Erro ao importar planilha: ' + error.message);
        event.target.disabled = false;
    }
}

// Alterar status do cliente
async function alterarStatus(id, novoStatus) {
    try {
        const response = await fetch(`${API_URL}/clientes/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ status: novoStatus })
        });

        if (response.ok) {
            mostrarSucesso('Status alterado com sucesso!');
        } else {
            const error = await response.json();
            mostrarErro(error.error || 'Erro ao alterar status');
            carregarClientes(); // Recarregar para reverter o select
        }
    } catch (error) {
        console.error('Erro ao alterar status:', error);
        mostrarErro('Erro ao alterar status');
        carregarClientes(); // Recarregar para reverter o select
    }
}

// Sincronizar (limpar e importar)
async function sincronizarPlanilha() {
    if (!confirm('⚠️ ATENÇÃO!\n\nEsta ação irá APAGAR TODOS os dados atuais e substituir pelos dados da planilha.\n\nDeseja continuar?')) {
        return;
    }

    try {
        const btn = event.target;
        const textoOriginal = btn.textContent;
        btn.disabled = true;
        btn.textContent = '⏳ Sincronizando...';

        const response = await fetch(`${API_URL}/sincronizar-planilha`, {
            method: 'POST',
            credentials: 'include'
        });

        const resultado = await response.json();

        if (response.ok) {
            carregarClientes();
            alert(`✅ Sincronização concluída!\n\n` +
                  `Total de registros importados: ${resultado.importados}`);
        } else {
            alert('❌ Erro: ' + resultado.error);
        }

        btn.disabled = false;
        btn.textContent = textoOriginal;
    } catch (error) {
        console.error('Erro ao sincronizar planilha:', error);
        alert('❌ Erro ao sincronizar planilha: ' + error.message);
        event.target.disabled = false;
    }
}
