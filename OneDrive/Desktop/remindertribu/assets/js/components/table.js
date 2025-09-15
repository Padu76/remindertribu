/**
 * Table Component
 * Utilities for creating and managing data tables
 */

window.TableComponent = {
    
    init() {
        console.log('📊 Table utilities initialized');
    },
    
    // Create table from data
    createTable(containerId, data, config = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error('Table container not found:', containerId);
            return;
        }
        
        const {
            columns = [],
            searchable = true,
            sortable = true,
            paginated = true,
            pageSize = 10,
            className = 'table',
            emptyMessage = 'Nessun dato disponibile',
            actions = []
        } = config;
        
        // Clear container
        container.innerHTML = '';
        
        // Create table structure
        const tableWrapper = document.createElement('div');
        tableWrapper.className = 'table-container';
        
        // Search bar
        if (searchable) {
            const searchBar = this.createSearchBar(containerId);
            tableWrapper.appendChild(searchBar);
        }
        
        // Table
        const table = document.createElement('table');
        table.className = className;
        table.id = `${containerId}_table`;
        
        // Header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        columns.forEach(column => {
            const th = document.createElement('th');
            th.textContent = column.label || column.key;
            
            if (sortable && column.sortable !== false) {
                th.style.cursor = 'pointer';
                th.addEventListener('click', () => {
                    this.sortTable(containerId, column.key);
                });
                
                // Add sort indicator
                const sortIcon = document.createElement('span');
                sortIcon.className = 'sort-icon';
                sortIcon.innerHTML = ' <i class="fas fa-sort"></i>';
                th.appendChild(sortIcon);
            }
            
            headerRow.appendChild(th);
        });
        
        // Actions column
        if (actions.length > 0) {
            const actionsHeader = document.createElement('th');
            actionsHeader.textContent = 'Azioni';
            headerRow.appendChild(actionsHeader);
        }
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Body
        const tbody = document.createElement('tbody');
        tbody.id = `${containerId}_tbody`;
        table.appendChild(tbody);
        
        tableWrapper.appendChild(table);
        
        // Pagination
        if (paginated) {
            const pagination = this.createPagination(containerId, Math.ceil(data.length / pageSize));
            tableWrapper.appendChild(pagination);
        }
        
        container.appendChild(tableWrapper);
        
        // Store configuration
        this.tableConfigs = this.tableConfigs || {};
        this.tableConfigs[containerId] = {
            data: data,
            filteredData: data,
            columns: columns,
            actions: actions,
            pageSize: pageSize,
            currentPage: 1,
            sortColumn: null,
            sortDirection: 'asc'
        };
        
        // Render data
        this.renderTableData(containerId);
        
        // Add styles
        this.ensureTableStyles();
        
        return table;
    },
    
    createSearchBar(tableId) {
        const searchWrapper = document.createElement('div');
        searchWrapper.className = 'table-search-wrapper';
        
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.className = 'form-control table-search';
        searchInput.placeholder = 'Cerca...';
        searchInput.addEventListener('input', (e) => {
            this.filterTable(tableId, e.target.value);
        });
        
        const searchIcon = document.createElement('i');
        searchIcon.className = 'fas fa-search search-icon';
        
        searchWrapper.appendChild(searchInput);
        searchWrapper.appendChild(searchIcon);
        
        return searchWrapper;
    },
    
    createPagination(tableId, totalPages) {
        const pagination = document.createElement('div');
        pagination.className = 'table-pagination';
        pagination.id = `${tableId}_pagination`;
        
        const info = document.createElement('div');
        info.className = 'pagination-info';
        info.id = `${tableId}_pagination_info`;
        
        const controls = document.createElement('div');
        controls.className = 'pagination-controls';
        controls.id = `${tableId}_pagination_controls`;
        
        pagination.appendChild(info);
        pagination.appendChild(controls);
        
        return pagination;
    },
    
    renderTableData(tableId) {
        const config = this.tableConfigs[tableId];
        if (!config) return;
        
        const tbody = document.getElementById(`${tableId}_tbody`);
        if (!tbody) return;
        
        const { filteredData, columns, actions, pageSize, currentPage } = config;
        
        // Calculate pagination
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const pageData = filteredData.slice(startIndex, endIndex);
        
        // Clear tbody
        tbody.innerHTML = '';
        
        if (pageData.length === 0) {
            const emptyRow = document.createElement('tr');
            const emptyCell = document.createElement('td');
            emptyCell.colSpan = columns.length + (actions.length > 0 ? 1 : 0);
            emptyCell.style.textAlign = 'center';
            emptyCell.style.padding = '2rem';
            emptyCell.style.opacity = '0.7';
            emptyCell.textContent = 'Nessun dato trovato';
            emptyRow.appendChild(emptyCell);
            tbody.appendChild(emptyRow);
            return;
        }
        
        // Render rows
        pageData.forEach((item, index) => {
            const row = document.createElement('tr');
            
            // Data columns
            columns.forEach(column => {
                const cell = document.createElement('td');
                
                if (column.render) {
                    cell.innerHTML = column.render(item[column.key], item, startIndex + index);
                } else {
                    const value = this.getNestedValue(item, column.key);
                    cell.textContent = this.formatCellValue(value, column);
                }
                
                row.appendChild(cell);
            });
            
            // Actions column
            if (actions.length > 0) {
                const actionsCell = document.createElement('td');
                actionsCell.className = 'actions-cell';
                
                actions.forEach(action => {
                    const button = document.createElement('button');
                    button.className = `btn-icon ${action.className || ''}`;
                    button.innerHTML = action.icon || action.label;
                    button.title = action.title || action.label;
                    
                    if (action.handler) {
                        button.addEventListener('click', () => {
                            action.handler(item, startIndex + index);
                        });
                    }
                    
                    actionsCell.appendChild(button);
                });
                
                row.appendChild(actionsCell);
            }
            
            tbody.appendChild(row);
        });
        
        // Update pagination
        this.updatePagination(tableId);
    },
    
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current && current[key], obj);
    },
    
    formatCellValue(value, column) {
        if (value === null || value === undefined) return '';
        
        if (column.type === 'date') {
            return new Date(value).toLocaleDateString('it-IT');
        } else if (column.type === 'datetime') {
            return new Date(value).toLocaleString('it-IT');
        } else if (column.type === 'currency') {
            return new Intl.NumberFormat('it-IT', {
                style: 'currency',
                currency: 'EUR'
            }).format(value);
        } else if (column.type === 'number') {
            return new Intl.NumberFormat('it-IT').format(value);
        } else if (column.type === 'boolean') {
            return value ? 'Sì' : 'No';
        }
        
        return String(value);
    },
    
    filterTable(tableId, searchTerm) {
        const config = this.tableConfigs[tableId];
        if (!config) return;
        
        const { data, columns } = config;
        const lowerSearchTerm = searchTerm.toLowerCase();
        
        if (!searchTerm) {
            config.filteredData = data;
        } else {
            config.filteredData = data.filter(item => {
                return columns.some(column => {
                    const value = this.getNestedValue(item, column.key);
                    return String(value).toLowerCase().includes(lowerSearchTerm);
                });
            });
        }
        
        config.currentPage = 1;
        this.renderTableData(tableId);
    },
    
    sortTable(tableId, column) {
        const config = this.tableConfigs[tableId];
        if (!config) return;
        
        const { filteredData } = config;
        
        // Toggle sort direction
        if (config.sortColumn === column) {
            config.sortDirection = config.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            config.sortColumn = column;
            config.sortDirection = 'asc';
        }
        
        // Sort data
        filteredData.sort((a, b) => {
            const aValue = this.getNestedValue(a, column);
            const bValue = this.getNestedValue(b, column);
            
            let comparison = 0;
            
            if (aValue < bValue) {
                comparison = -1;
            } else if (aValue > bValue) {
                comparison = 1;
            }
            
            return config.sortDirection === 'desc' ? comparison * -1 : comparison;
        });
        
        // Update sort icons
        const table = document.getElementById(`${tableId}_table`);
        const headers = table.querySelectorAll('th .sort-icon');
        headers.forEach(icon => {
            icon.innerHTML = ' <i class="fas fa-sort"></i>';
        });
        
        const activeHeader = table.querySelector(`th:nth-child(${config.columns.findIndex(col => col.key === column) + 1}) .sort-icon`);
        if (activeHeader) {
            const icon = config.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
            activeHeader.innerHTML = ` <i class="fas ${icon}"></i>`;
        }
        
        this.renderTableData(tableId);
    },
    
    updatePagination(tableId) {
        const config = this.tableConfigs[tableId];
        if (!config) return;
        
        const { filteredData, pageSize, currentPage } = config;
        const totalPages = Math.ceil(filteredData.length / pageSize);
        
        // Update info
        const infoElement = document.getElementById(`${tableId}_pagination_info`);
        if (infoElement) {
            const startItem = ((currentPage - 1) * pageSize) + 1;
            const endItem = Math.min(currentPage * pageSize, filteredData.length);
            infoElement.textContent = `${startItem}-${endItem} di ${filteredData.length}`;
        }
        
        // Update controls
        const controlsElement = document.getElementById(`${tableId}_pagination_controls`);
        if (controlsElement) {
            controlsElement.innerHTML = '';
            
            // Previous button
            const prevBtn = document.createElement('button');
            prevBtn.className = 'pagination-btn';
            prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
            prevBtn.disabled = currentPage === 1;
            prevBtn.addEventListener('click', () => {
                if (currentPage > 1) {
                    config.currentPage--;
                    this.renderTableData(tableId);
                }
            });
            controlsElement.appendChild(prevBtn);
            
            // Page numbers
            const startPage = Math.max(1, currentPage - 2);
            const endPage = Math.min(totalPages, startPage + 4);
            
            for (let i = startPage; i <= endPage; i++) {
                const pageBtn = document.createElement('button');
                pageBtn.className = 'pagination-btn';
                if (i === currentPage) pageBtn.classList.add('active');
                pageBtn.textContent = i;
                pageBtn.addEventListener('click', () => {
                    config.currentPage = i;
                    this.renderTableData(tableId);
                });
                controlsElement.appendChild(pageBtn);
            }
            
            // Next button
            const nextBtn = document.createElement('button');
            nextBtn.className = 'pagination-btn';
            nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
            nextBtn.disabled = currentPage === totalPages;
            nextBtn.addEventListener('click', () => {
                if (currentPage < totalPages) {
                    config.currentPage++;
                    this.renderTableData(tableId);
                }
            });
            controlsElement.appendChild(nextBtn);
        }
    },
    
    // Utility methods
    addRow(tableId, data) {
        const config = this.tableConfigs[tableId];
        if (!config) return;
        
        config.data.push(data);
        config.filteredData = config.data;
        this.renderTableData(tableId);
    },
    
    removeRow(tableId, index) {
        const config = this.tableConfigs[tableId];
        if (!config) return;
        
        config.data.splice(index, 1);
        config.filteredData = config.data;
        this.renderTableData(tableId);
    },
    
    updateRow(tableId, index, data) {
        const config = this.tableConfigs[tableId];
        if (!config) return;
        
        config.data[index] = { ...config.data[index], ...data };
        config.filteredData = config.data;
        this.renderTableData(tableId);
    },
    
    refreshTable(tableId, newData = null) {
        const config = this.tableConfigs[tableId];
        if (!config) return;
        
        if (newData) {
            config.data = newData;
            config.filteredData = newData;
        }
        
        this.renderTableData(tableId);
    },
    
    ensureTableStyles() {
        if (document.getElementById('table-component-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'table-component-styles';
        styles.textContent = `
            .table-container {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 15px;
                overflow: hidden;
                margin: 2rem 0;
            }
            
            .table-search-wrapper {
                padding: 1rem;
                background: rgba(255, 255, 255, 0.1);
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                position: relative;
            }
            
            .table-search {
                max-width: 300px;
                padding-right: 2.5rem;
            }
            
            .search-icon {
                position: absolute;
                right: 1.75rem;
                top: 50%;
                transform: translateY(-50%);
                color: rgba(255, 255, 255, 0.6);
                pointer-events: none;
            }
            
            .sort-icon {
                opacity: 0.6;
                transition: opacity 0.3s;
            }
            
            th:hover .sort-icon {
                opacity: 1;
            }
            
            .actions-cell {
                white-space: nowrap;
            }
            
            .actions-cell .btn-icon {
                margin: 0 0.25rem;
            }
            
            .table-pagination {
                padding: 1rem;
                background: rgba(255, 255, 255, 0.05);
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .pagination-info {
                color: rgba(255, 255, 255, 0.7);
                font-size: 0.9rem;
            }
            
            .pagination-controls {
                display: flex;
                gap: 0.25rem;
            }
            
            .pagination-btn {
                padding: 0.5rem 0.75rem;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 6px;
                color: white;
                cursor: pointer;
                transition: all 0.3s;
                font-size: 0.9rem;
            }
            
            .pagination-btn:hover:not(:disabled) {
                background: var(--primary, #25D366);
                border-color: var(--primary, #25D366);
            }
            
            .pagination-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            
            .pagination-btn.active {
                background: var(--primary, #25D366);
                border-color: var(--primary, #25D366);
            }
            
            @media (max-width: 768px) {
                .table-pagination {
                    flex-direction: column;
                    gap: 1rem;
                }
                
                .table-search {
                    max-width: none;
                    width: 100%;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }
};