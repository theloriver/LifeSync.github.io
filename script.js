/* LifeSync prototype: navigation, calendar, budget, tasks, and local browser storage. */
(() => {
    'use strict';
    const key = 'lifesync-v1';
    let data;
    try {
        data = JSON.parse(localStorage.getItem(key));
    }
    catch { }
    if (!data || !Array.isArray(data.events) || !Array.isArray(data.tasks) || !Array.isArray(data.money))
        data = { events: [], tasks: [], money: [] };
    const $ = id => document.getElementById(id), money = n => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(n), safe = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])), save = () => localStorage.setItem(key, JSON.stringify(data)), uid = () => String(Date.now()) + Math.random().toString(36).slice(2), today = new Date();
    const todayKey = () => { const d = new Date(); return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-'); };
    $('today').textContent = today.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
    document.querySelector('#eventForm [name=date]').value = todayKey();
    const datestr = (d, t = '') => { if (!d)
        return 'No due date'; const dt = new Date(d + 'T' + (t || '12:00')); return Number.isNaN(dt.getTime()) ? d : dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) + (t ? ' · ' + dt.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : ''); };
    function go(view) { document.querySelectorAll('.section').forEach(x => x.classList.toggle('active', x.id === view)); document.querySelectorAll('[data-view]').forEach(x => x.classList.toggle('active', x.dataset.view === view)); $('heading').textContent = ({ dashboard: 'Your day, in sync ✨', calendar: 'Your calendar', budget: 'Your budget', tasks: 'Your tasks' })[view]; document.getElementById('app').scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => go(b.dataset.view)));
    document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => go(b.dataset.go)));
    $('quickAdd').addEventListener('click', () => { go('tasks'); document.querySelector('#taskForm [name=title]').focus(); });
    let dark = localStorage.getItem('lifesync-theme') === 'dark';
    function theme() { document.body.classList.toggle('dark', dark); $('theme').textContent = dark ? '☀ Light mode' : '☾ Dark mode'; }
    theme();
    $('theme').addEventListener('click', () => { dark = !dark; localStorage.setItem('lifesync-theme', dark ? 'dark' : 'light'); theme(); });
    const sortedEvents = () => [...data.events].sort((a, b) => (a.date + 'T' + a.time).localeCompare(b.date + 'T' + b.time));
    function eventHtml(e) { return `<div class="event"><div class="event-bar ${safe(e.category)}"></div><div class="grow"><div class="item-title">${safe(e.title)}</div><div class="item-sub">${safe(datestr(e.date, e.time))}</div></div><span class="pill">${safe(e.category)}</span><button class="delete" data-delete="event" data-id="${safe(e.id)}" aria-label="Delete ${safe(e.title)}">×</button></div>`; }
    function taskHtml(t) { return `<div class="task"><input type="checkbox" data-toggle="${safe(t.id)}" ${t.done ? 'checked' : ''} aria-label="Complete ${safe(t.title)}"><div class="grow"><div class="item-title ${t.done ? 'done' : ''}">${safe(t.title)}</div><div class="item-sub">${safe(datestr(t.date))}</div></div><button class="delete" data-delete="task" data-id="${safe(t.id)}" aria-label="Delete ${safe(t.title)}">×</button></div>`; }
    function moneyHtml(m) { return `<div class="transaction"><div class="grow"><div class="item-title">${safe(m.title)}</div><div class="item-sub">${m.type === 'income' ? 'Income' : 'Expense'}</div></div><strong style="color:${m.type === 'income' ? '#16a085' : 'var(--text)'}">${m.type === 'income' ? '+' : '−'}${money(m.amount)}</strong><button class="delete" data-delete="money" data-id="${safe(m.id)}" aria-label="Delete ${safe(m.title)}">×</button></div>`; }
    function render() { const upcoming = sortedEvents().filter(e => e.date >= todayKey()), open = data.tasks.filter(t => !t.done), inc = data.money.filter(m => m.type === 'income').reduce((s, m) => s + Number(m.amount), 0), exp = data.money.filter(m => m.type === 'expense').reduce((s, m) => s + Number(m.amount), 0), balance = inc - exp; $('statEvents').textContent = upcoming.length; $('statTasks').textContent = open.length; $('statBalance').textContent = money(balance); $('statDone').textContent = data.tasks.length ? Math.round((data.tasks.length - open.length) / data.tasks.length * 100) + '%' : '0%'; $('dashboardEvents').innerHTML = upcoming.slice(0, 4).map(eventHtml).join('') || '<div class="empty">No upcoming events. Add one in Calendar.</div>'; $('allEvents').innerHTML = sortedEvents().map(eventHtml).join('') || '<div class="empty">No events yet.</div>'; $('dashboardTasks').innerHTML = open.slice(0, 4).map(taskHtml).join('') || '<div class="empty">All caught up! Add a new task.</div>'; $('allTasks').innerHTML = data.tasks.map(taskHtml).join('') || '<div class="empty">No tasks yet.</div>'; $('taskCount').textContent = open.length + ' remaining'; $('allMoney').innerHTML = [...data.money].reverse().map(moneyHtml).join('') || '<div class="empty">No budget entries yet.</div>'; for (const [id, value] of [['income', inc], ['expenses', exp], ['remaining', balance], ['dashIncome', inc], ['dashExpenses', exp], ['dashRemaining', balance]])
        $(id).textContent = money(value); $('budgetProgress').style.width = (inc > 0 ? Math.min(100, exp / inc * 100) : 0) + '%'; }
    $('eventForm').addEventListener('submit', e => { e.preventDefault(); const f = new FormData(e.currentTarget); data.events.push({ id: uid(), title: f.get('title').trim(), date: f.get('date'), time: f.get('time'), category: f.get('category') }); save(); e.currentTarget.reset(); document.querySelector('#eventForm [name=date]').value = todayKey(); render(); });
    $('taskForm').addEventListener('submit', e => { e.preventDefault(); const f = new FormData(e.currentTarget); data.tasks.push({ id: uid(), title: f.get('title').trim(), date: f.get('date'), done: false }); save(); e.currentTarget.reset(); render(); });
    $('moneyForm').addEventListener('submit', e => { e.preventDefault(); const f = new FormData(e.currentTarget); const amount = Number(f.get('amount')); if (!Number.isFinite(amount) || amount <= 0)
        return; data.money.push({ id: uid(), title: f.get('title').trim(), amount, type: f.get('type') }); save(); e.currentTarget.reset(); render(); });
    document.addEventListener('change', e => { const id = e.target.dataset.toggle; if (id) {
        const t = data.tasks.find(x => x.id === id);
        if (t) {
            t.done = e.target.checked;
            save();
            render();
        }
    } });
    document.addEventListener('click', e => { const b = e.target.closest('[data-delete]'); if (!b)
        return; const collection = { event: 'events', task: 'tasks', money: 'money' }[b.dataset.delete]; if (!collection)
        return; data[collection] = data[collection].filter(x => x.id !== b.dataset.id); save(); render(); });
    render();
})();
