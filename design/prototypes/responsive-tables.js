/* Prototype adapter generated from the Open Design Warp responsive-table contract.
   Production React uses src/components/data-table/ instead. */
const responsiveTableConfigs = [
  ['jobs-table', 1, 0, 2, 5],
  ['webhooks-table', 0, 0, 2, 4],
  ['groups-table', 1, 1, 4, 6],
  ['messages-table', 0, 0, 2, 5],
  ['events-table', 1, 2, 3, 0],
  ['settings-keys-table', 0, 0, 1, 4],
];

const text = (cell) => cell?.textContent?.trim() || '—';

responsiveTableConfigs.forEach(([wrapperClass, identityIndex, idIndex, statusIndex, metaIndex]) => {
  document.querySelectorAll(`.${wrapperClass}`).forEach((wrapper) => {
    if (wrapper.classList.contains('adaptive-table')) return;
    const table = wrapper.querySelector(':scope > table, :scope > .scroll > table');
    if (!table || table.classList.contains('minitable')) return;

    wrapper.classList.add('adaptive-table');
    table.classList.add('responsive-table');
    table.querySelectorAll('thead tr').forEach((row) => {
      row.querySelectorAll('th').forEach((cell) => cell.classList.add('responsive-table-desktop-cell'));
      const summaryHeader = document.createElement('th');
      summaryHeader.className = 'responsive-table-mobile-header';
      summaryHeader.scope = 'col';
      summaryHeader.textContent = 'Summary';
      row.append(summaryHeader);
    });

    table.querySelectorAll('tbody tr').forEach((row) => {
      const cells = [...row.children];
      cells.forEach((cell) => cell.classList.add('responsive-table-desktop-cell'));
      const identityCell = cells[identityIndex];
      const idCell = cells[idIndex];
      const statusCell = cells[statusIndex];
      const metaCell = cells[metaIndex];
      const primary = identityCell?.querySelector('.resource-name,.messages-resource-name,.settings-key-name')?.textContent?.trim() || text(identityCell);
      const identifier = identityCell?.querySelector('.row-id,.mono')?.textContent?.trim() || idCell?.querySelector('.mono')?.textContent?.trim() || text(idCell);
      const status = statusCell?.querySelector('.status')?.cloneNode(true);

      const summaryCell = document.createElement('td');
      summaryCell.className = 'responsive-table-mobile-cell';
      summaryCell.colSpan = cells.length + 1;
      const summary = document.createElement('div');
      summary.className = 'mobile-row-summary';
      summary.innerHTML = `<span class="mobile-row-identity"><span class="mobile-row-primary"></span><span class="mobile-row-id mono"></span></span><span class="mobile-row-secondary"><span class="mobile-row-status"></span><span class="mobile-row-meta"></span></span><span class="mobile-row-disclosure" aria-hidden="true">›</span>`;
      if (wrapperClass === 'groups-table') {
        summary.classList.add('has-selection');
        const selection = document.createElement('span');
        selection.className = 'mobile-row-selection';
        const control = document.createElement('label');
        control.className = 'data-table-selection-control';
        const checkbox = cells[0]?.querySelector('input[type="checkbox"]')?.cloneNode(true);
        if (checkbox) control.append(checkbox);
        selection.append(control);
        summary.prepend(selection);
        if (cells[0]?.querySelector('input[type="checkbox"]')?.checked) row.classList.add('is-checked');
        if (row.classList.contains('selected')) row.classList.add('is-active');
      }
      summary.querySelector('.mobile-row-primary').textContent = primary;
      summary.querySelector('.mobile-row-id').textContent = identifier;
      const statusTarget = summary.querySelector('.mobile-row-status');
      if (status) statusTarget.replaceWith(status);
      else statusTarget.textContent = text(statusCell);
      summary.querySelector('.mobile-row-meta').textContent = text(metaCell);
      summaryCell.append(summary);
      row.append(summaryCell);
    });

    table.querySelectorAll('tr').forEach((row) => {
      const cells = [...row.children];
      if (wrapperClass === 'groups-table') {
        cells[0]?.classList.add('responsive-table-sticky-checkbox');
        cells[identityIndex]?.classList.add('responsive-table-sticky-identity', 'responsive-table-sticky-after-checkbox');
      } else {
        cells[identityIndex]?.classList.add('responsive-table-sticky-identity');
      }
    });

    const currentParent = table.parentElement;
    if (currentParent?.classList.contains('scroll')) {
      currentParent.classList.add('responsive-table-scroll');
    } else if (!currentParent?.classList.contains('responsive-table-scroll')) {
      const scroll = document.createElement('div');
      scroll.className = 'responsive-table-scroll';
      currentParent?.insertBefore(scroll, table);
      scroll.append(table);
    }
  });
});
