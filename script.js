(() => {
  const KEY = 'yuki_clientes_v2';
  const $ = (id) => document.getElementById(id);
  let clients = load();

  function load() {
    try {
      const data = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(data) ? data : [];
    } catch { return []; }
  }
  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(clients));
      return true;
    } catch {
      $('notice').textContent = 'No se pudo guardar. Revisa el espacio disponible del navegador.';
      return false;
    }
  }
  function makeId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function dateTime(value) {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' });
  }
  function duration(start, end) {
    const mins = Math.max(0, Math.floor(((end ? new Date(end) : new Date()) - new Date(start)) / 60000));
    const h = Math.floor(mins / 60), m = mins % 60;
    return h ? `${h} h ${m} min` : `${m} min`;
  }

  $('entryForm').addEventListener('submit', e => {
    e.preventDefault();
    const name = $('clientName').value.trim();
    const people = Number.parseInt($('peopleCount').value, 10);
    if (!name || !Number.isInteger(people) || people < 1) {
      $('notice').textContent = 'Escribe el nombre y una cantidad de personas válida.';
      return;
    }
    const item = { id: makeId(), name, people, entry: new Date().toISOString(), exit: null };
    clients.unshift(item);
    if (save()) {
      $('clientName').value = '';
      $('peopleCount').value = '1';
      $('notice').textContent = `Entrada guardada para ${name} (${people} ${people === 1 ? 'persona' : 'personas'}).`;
    }
    render();
  });

  $('search').addEventListener('input', render);
  $('clientList').addEventListener('click', e => {
    const button = e.target.closest('button[data-action]');
    if (!button) return;
    const item = clients.find(c => c.id === button.dataset.id);
    if (!item) return;
    if (button.dataset.action === 'exit' && !item.exit) {
      item.exit = new Date().toISOString();
      if (save()) $('notice').textContent = `Salida guardada para ${item.name}.`;
    } else if (button.dataset.action === 'delete') {
      if (!confirm(`¿Eliminar el registro de ${item.name}? Esta acción no se puede deshacer.`)) return;
      clients = clients.filter(c => c.id !== item.id);
      if (save()) $('notice').textContent = `Registro de ${item.name} eliminado.`;
    }
    render();
  });

  function render() {
    const query = $('search').value.trim().toLocaleLowerCase('es');
    const filtered = clients.filter(c => String(c.name).toLocaleLowerCase('es').includes(query));
    const totalPeople = filtered.reduce((sum, c) => sum + (Number(c.people) || 1), 0);
    $('summary').textContent = `${filtered.length} ${filtered.length === 1 ? 'registro' : 'registros'} · ${totalPeople} ${totalPeople === 1 ? 'persona' : 'personas'} en los resultados`;
    $('clientList').innerHTML = filtered.map(c => {
      const people = Number(c.people) || 1;
      return `<article class="client-card">
        <div class="client-info">
          <h3>${escapeHTML(c.name)} <span class="status ${c.exit ? 'closed' : 'open'}">${c.exit ? 'Salida registrada' : 'Dentro'}</span></h3>
          <div class="meta"><strong>Personas:</strong> ${people}<br><strong>Hora de entrada:</strong> ${dateTime(c.entry)}<br><strong>Hora de salida:</strong> ${c.exit ? dateTime(c.exit) : 'Pendiente'}<br><strong>Tiempo:</strong> ${duration(c.entry, c.exit)}</div>
        </div>
        <div class="actions">${c.exit ? '' : `<button class="button" data-action="exit" data-id="${c.id}">Guardar hora de salida</button>`}<button class="button danger" data-action="delete" data-id="${c.id}">Eliminar</button></div>
      </article>`;
    }).join('');
    $('emptyState').hidden = filtered.length > 0;
  }
  render();
})();
