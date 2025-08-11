document.addEventListener('DOMContentLoaded', () => {
    const userInfoDiv = document.getElementById('user-info');
    const shareFormSection = document.getElementById('share-form-section');
    const shareForm = document.getElementById('share-form');
    const proxyListDiv = document.getElementById('proxy-list');
    const API_BASE_URL = 'http://127.0.0.1:3001/api';

    let currentUser = null; 

    const fetchOptions = { credentials: 'include' };

    const checkAuthStatus = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/auth/profile`, fetchOptions);
            if (response.ok) {
                const data = await response.json();
                currentUser = data.user; 
                userInfoDiv.innerHTML = `<div class="flex items-center gap-4"><span class="font-semibold text-white">欢迎, ${currentUser.name}</span><a href="${API_BASE_URL}/auth/logout" class="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition-colors duration-300">登出</a></div>`;
                shareFormSection.classList.remove('hidden');
            } else {
                currentUser = null; 
                userInfoDiv.innerHTML = `<a href="${API_BASE_URL}/auth/linuxdo" class="bg-cyan-500 hover:bg-cyan-600 text-white font-bold py-2 px-4 rounded transition-colors duration-300">使用 Linux.do 登录</a>`;
                shareFormSection.classList.add('hidden');
            }
        } catch (error) {
            currentUser = null;
            console.error('检查认证状态失败:', error);
            userInfoDiv.innerHTML = '<p class="text-red-400">无法连接到服务器</p>';
        }
    };
    
    const fetchAndRenderProxies = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/proxies`, fetchOptions);
            if (!response.ok) throw new Error('获取节点列表失败');
            const { data } = await response.json();
            proxyListDiv.innerHTML = '';
            if (data && data.length > 0) {
                data.forEach(proxy => {
                    const card = document.createElement('div');
                    card.className = 'proxy-card bg-gray-800 p-4 rounded-lg border border-gray-700 shadow-md';
                    card.id = `proxy-card-${proxy.id}`;

                    let deleteButtonHtml = '';
                    if (currentUser && currentUser.id === proxy.uploader_id) {
                        deleteButtonHtml = `<button data-proxy-id="${proxy.id}" title="删除节点" class="delete-btn text-gray-500 hover:text-red-500 text-xl transition-colors duration-200">🗑️</button>`;
                    }

                    card.innerHTML = `
                        <div class="flex justify-between items-start">
                            <div class="flex-grow mr-4">
                                <p class="text-sm text-gray-400">地区: <span class="font-semibold text-cyan-400">${proxy.region || '未知'}</span> | 类型: <span class="font-semibold text-cyan-400">${proxy.ip_type || '未知'}</span> | 剩余流量: <span class="font-semibold text-cyan-400">${proxy.remaining_traffic || '未知'}</span></p>
                                <code class="block w-full bg-gray-900 text-gray-300 p-2 my-2 rounded-md break-all">${proxy.node_text}</code>
                                <p class="text-xs text-gray-500">由 ${proxy.uploader_id} 于 ${new Date(proxy.upload_time).toLocaleString()} 上传</p>
                            </div>
                            <div class="flex flex-col items-center gap-4">
                                <div class="flex flex-col items-center gap-2">
                                    <button data-proxy-id="${proxy.id}" data-valid="true" title="标记为有效" class="vote-btn text-green-500 hover:text-green-400 text-2xl transition-transform duration-200 hover:scale-125">👍</button>
                                    <button data-proxy-id="${proxy.id}" data-valid="false" title="标记为无效" class="vote-btn text-red-500 hover:text-red-400 text-2xl transition-transform duration-200 hover:scale-125">👎</button>
                                </div>
                                ${deleteButtonHtml} 
                            </div>
                        </div>
                    `;
                    proxyListDiv.appendChild(card);
                });
            } else {
                proxyListDiv.innerHTML = '<p class="text-gray-400">还没有人分享节点，快来当第一个吧！</p>';
            }
        } catch (error) {
            console.error('获取节点失败:', error);
            proxyListDiv.innerHTML = '<p class="text-red-400">加载节点列表失败...</p>';
        }
    };
    
    // vvvvvvvv 这是我上次遗漏的函数定义 vvvvvvvv
    const handleFormSubmit = async (event) => {
        event.preventDefault();
        const formData = {
            node_text: document.getElementById('node_text').value,
            region: document.getElementById('region').value,
            ip_type: document.getElementById('ip_type').value,
            remaining_traffic: document.getElementById('remaining_traffic').value,
        };
        try {
            const response = await fetch(`${API_BASE_URL}/proxies`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
                ...fetchOptions
            });
            if (!response.ok) {
                if(response.status === 401) { alert('请先登录再分享节点！'); return; }
                throw new Error('分享失败');
            }
            shareForm.reset();
            // 分享成功后，重新获取并渲染列表，这样就能看到自己刚发的节点了
            await fetchAndRenderProxies(); 
        } catch (error) {
            console.error('分享节点失败:', error);
            alert('分享失败，请稍后再试。');
        }
    };
    // ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

    const handleVoteClick = async (event) => {
        // 处理点赞/点踩
        if (event.target.classList.contains('vote-btn')) {
            const button = event.target;
            const proxyId = button.dataset.proxyId;
            const isValid = button.dataset.valid === 'true';
            try {
                const response = await fetch(`${API_BASE_URL}/proxies/${proxyId}/report`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isValid }), ...fetchOptions
                });
                const result = await response.json();
                alert(result.message);
                if (response.ok) {
                    const parent = button.parentElement;
                    parent.querySelectorAll('.vote-btn').forEach(btn => {
                        btn.disabled = true;
                        btn.classList.add('opacity-50', 'cursor-not-allowed');
                        btn.classList.remove('hover:scale-125');
                    });
                }
            } catch (error) { console.error('评价失败:', error); alert('操作失败，请稍后再试。'); }
        }
        // 处理删除
        if (event.target.classList.contains('delete-btn')) {
            const button = event.target;
            const proxyId = button.dataset.proxyId;
            if (confirm(`你确定要删除 ID 为 ${proxyId} 的这个节点吗？此操作不可撤销。`)) {
                try {
                    const response = await fetch(`${API_BASE_URL}/proxies/${proxyId}`, { method: 'DELETE', ...fetchOptions });
                    const result = await response.json();
                    alert(result.message);
                    if (response.ok) {
                        document.getElementById(`proxy-card-${proxyId}`).remove();
                    }
                } catch (error) {
                    console.error('删除失败:', error);
                    alert('删除失败，请稍后再试。');
                }
            }
        }
    };
    
    const initializePage = async () => {
        await checkAuthStatus();
        await fetchAndRenderProxies();
    };

    initializePage();
    shareForm.addEventListener('submit', handleFormSubmit);
    proxyListDiv.addEventListener('click', handleVoteClick);
});