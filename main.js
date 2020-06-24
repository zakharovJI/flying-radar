class Main {
    constructor() {
        this.table = document.querySelector('#mainTable');
        this.uploadedData = null;
        this.baseCoordinates = [55.410, 37.902];
        this.tableBody = this.table.querySelector('tbody');
        this.store = window.localStorage;
    }

    init() {
        this.bindDownloadInterval();
        this.bindSortingClickListener();

        if (!this.store.getObj('selectedRows')) {
          this.store.setObj('selectedRows', []);
        }
    }

    makeFlyingDataRequest() {
      fetch('https://data-live.flightradar24.com/zones/fcgi/feed.js?bounds=56.84,55.27,33.48,41.48')
        .then((response) => {
          return response.json();
        })
        .then((data) => {
          this.uploadedData = this.parseUploadedData(data);
          this.updateTableData(this.parseUploadedData(data));
          this.bindRowClickListener();
          this.setSelectedRows();
        });
    }

    async bindDownloadInterval() {
      await this.makeFlyingDataRequest();
      
      setInterval(() => {
        this.makeFlyingDataRequest();
      }, 5000)
    }

    bindSortingClickListener() {

      this.table.querySelectorAll('.sortable').forEach(item => {
        item.addEventListener('click', () => {
          const sortingKey = item.getAttribute('data-sorting-key'),
            sortingState = item.getAttribute('data-sorting-state');
  
          if (sortingState) {
            this.uploadedData = this.uploadedData.sort((a, b) => b[sortingKey] - a[sortingKey])
            item.removeAttribute('data-sorting-state');
          } else {
            this.uploadedData = this.uploadedData.sort((a, b) => a[sortingKey] - b[sortingKey])
            item.setAttribute('data-sorting-state', true);
          }
  
          this.updateTableData(this.uploadedData);
          this.setSelectedRows();
          this.bindRowClickListener();
        });
      });
    }

    bindRowClickListener() {

      this.tableBody.querySelectorAll('tr').forEach((row, index) => {
        row.addEventListener('click', () => {
          console.log(12412321);
          
          const tempStore = Array.from(this.store.getObj('selectedRows'));

          if (row.classList.contains('selected')) {
            tempStore.splice(tempStore.indexOf(index), 1);
            row.classList.remove('selected');            
            this.store.setObj('selectedRows', tempStore);
          } else {
            row.classList.add('selected');            
            this.store.setObj('selectedRows', [...tempStore, ...[index]]);
          }
        })
      })
    }

    removeEventListeners() {

    }

    setSelectedRows() {
      this.tableBody.querySelectorAll('tr').forEach((row, index) => {
        if (this.store.getObj('selectedRows').includes(index)) {
          row.classList.add('selected');            
        }
      })
    }

    parseUploadedData(data) {
      let iterator = Object.keys(data).slice(2, -1);
      const parsedData = [];

      iterator.forEach(item => {
        
        parsedData.push({
          flightNumber: data[item][0],
          coordinates: [data[item][1], data[item][2]],
          speed: data[item][5],
          degrees: data[item][3],
          height: data[item][4],
          airports: {from: data[item][11], to: data[item][12]},
          distance: this.coordinates2meters(...this.baseCoordinates, data[item][1], data[item][2])
        })        
      });

      parsedData.sort((a, b) => a.distance - b.distance);
      
      const sortingState = this.table.querySelector('[data-sorting-key="distance"]').getAttribute('data-sorting-state');

      if (sortingState) {
        parsedData.sort((a, b) => a.distance - b.distance);
        // item.removeAttribute('data-sorting-state');
      } else {
        parsedData.sort((a, b) => b.distance - a.distance);
        // item.setAttribute('data-sorting-state', true);
      }

      return parsedData;
    }

    updateTableData(parsedData) {
      this.tableBody.innerHTML = '';

      parsedData.forEach(rowData => {
        const row = document.createElement('tr'),
          iterable = Object.keys(rowData);

        iterable.forEach(item => {
          const cellData = rowData[item];
          const cell = document.createElement('td');

          cell.classList.add(`table-data_${item}`);

          if (typeof cellData === 'object') {

            if (item !== 'airports') {
              cellData.forEach(dt => {
                const $span = document.createElement('span');
                $span.innerText = dt;
                cell.appendChild($span);
              })
            } else {
              Object.keys(cellData).forEach(dt => {
                if (cellData[dt]) {
                  const $span = document.createElement('span');

                  if (dt === 'from') {
                    $span.classList.add('airports_first')
                  } else {
                    $span.classList.add('airports_last')
                  }

                  $span.innerText = cellData[dt];
                  cell.appendChild($span);
                }
              })
            }

          } else {
            cell.appendChild(document.createTextNode(cellData));
          }

          row.appendChild(cell);
        });
    
        this.tableBody.appendChild(row);
      
      })
    }

    coordinates2meters(lat1, lon1, lat2, lon2) {
      const R = 6378.137,
        dLat = lat2 * Math.PI / 180 - lat1 * Math.PI / 180,
        dLon = lon2 * Math.PI / 180 - lon1 * Math.PI / 180,
        a = Math.sin(dLat/2) * Math.sin(dLat/2) + 
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2),
        c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)),
        d = R * c;

      return parseInt(d * 1000); 
    }




}

Storage.prototype.setObj = function(key, obj) {
  return this.setItem(key, JSON.stringify(obj))
}
Storage.prototype.getObj = function(key) {
  return JSON.parse(this.getItem(key))
}

if (window.NodeList && !NodeList.prototype.forEach) {
  NodeList.prototype.forEach = Array.prototype.forEach;
}

let test = new Main().init();