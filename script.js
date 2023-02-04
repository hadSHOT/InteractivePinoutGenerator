var connectorData = [
///DATA///
];

var columns = ///COLS///

var printColumns = ///PRINT_COLS///

function hideEmptyColumns(table) {
  var rows = table.querySelector('tbody').children;
  var tableHead = table.querySelector("thead>tr")
  var cols = tableHead.children
  for (var i = 0; i < cols.length; i++) {
    var empty = true;
    for (var ii = 0; ii < rows.length; ii++) {
      empty = rows[ii].children[i].textContent.length > 0 ? false : empty;
    }
    if (empty) {
      tableHead.querySelectorAll('th')[i].style.display = 'none';
      for (var ii = 0; ii < rows.length; ii++) {
        rows[ii].children[i].style.display = 'none';
      }
    } else {
      tableHead.querySelectorAll('th')[i].style.display = '';
      for (var ii = 0; ii < rows.length; ii++) {
        rows[ii].children[i].style.display = '';
      }
    }
  }
}

function addRow(table, pin) {
  var clone = getRow(table, pin)
  table.appendChild(clone);
}

function addRow(table, pin, cid) {
  var clone = getRow(table, pin)
  var row = clone.querySelector(".data");
  if (pin.pdiv) {
    row.addEventListener('click', function(table, pin, cid) {
      var container;
      for (var elem = table; elem && elem !== document; elem = elem.parentNode) {
        if (elem.matches(".container")) {
          var container = elem;
        };
      }
      clickPin(container.querySelector(".info-table tbody"), pin, cid);
      container.scrollIntoView()
    }.bind(null, table, pin, cid));
  }
  table.appendChild(clone);
}

function getRow(table, pin) {
  var template = document.getElementById("table-template");
  var clone = template.content.cloneNode(true);
  var row = clone.querySelector(".data");
  for (const column in columns) {
    var el = document.createElement("td")
    if ( printColumns.indexOf(column) !== -1 ) {
      el.classList.add("print-column");
    }
    el.textContent = Array.isArray(pin[columns[column]]) ? pin[columns[column]].join(", ") : pin[columns[column]];
    el.dataset.field = column
    row.appendChild(el);
  }
  clone.querySelector('[data-field="pin"]').dataset.type = pin.type;
  return clone;
}

function clickPin(table, pin, cid) {
  var container;
  for (var elem = table; elem && elem !== document; elem = elem.parentNode) {
    if (elem.matches(".container")) {
      container = elem;
    };
  }
  table.parentElement.style.display = "table";
  table.innerHTML = "";
  addRow(table, pin, cid);
  var pins = document.querySelectorAll(".pin-marker");
  for (var i = 0; i < pins.length; i++) {
    if (pins[i].dataset.type == pin.type) {
      pins[i].classList.add("highlight");
    } else {
      pins[i].classList.remove("highlight");
    }
    pins[i].classList.remove("selected");
  }
  pin.pdiv.classList.add("selected");
  hideEmptyColumns(table.parentElement);
  if (typeof(cid) != "undefined") {
    var url = new URL(window.location);
    url.searchParams.set("connector", cid);
    url.searchParams.set("pin", pin.pin);
    window.history.pushState({}, "", url)
  } else {
    var url = new URL(window.location);
    url.search = "";
    window.history.pushState({}, "", url)
  }
  container.scrollIntoView()
}

function checkparams() {
  var params = new URLSearchParams(window.location.search);
  var connector = params.get("connector");
  var pin = params.get("pin");
  for (var i = 0; i < connectorData.length; i++) {
    var c = connectorData[i];
    if (c.info.id == connector) {
      var table = document.querySelectorAll(".info-table tbody")[i];
      for (var iii = 0; iii < c.pins.length; iii++) {
        if (c.pins[iii].pin == pin) {
          clickPin(table, c.pins[iii], c.info.id);
          return;
        }
      }
      return;
    }
  }
}

var images = 0;

function checkImagesLoaded() {
  images -= 1;
  if (images == 0) {
    checkparams();
  }
}

window.addEventListener('load', function() {
  window.onpopstate = function(ev) {
    if (event.state) {
      checkparams();
    }
  };
  for (var c = 0; c < connectorData.length; c++) {
    connectorData[c] = JSON.parse(connectorData[c]);
    var connector = connectorData[c];
    var template = document.getElementById("connector-template");
    var clone = template.content.cloneNode(true);
    document.body.appendChild(clone);
    var sdiv = document.body.lastChild.previousSibling;
    var img = sdiv.querySelector(".connector-img");
    images += 1;
    img.addEventListener('load', function(connector, sdiv, img) {
      var cdiv = sdiv.querySelector(".connector-div");
      var cid = connector.info.id;
      var ptemplate = document.getElementById("pin-template");
      var imgHeight = img.naturalHeight;
      var imgWidth = img.naturalWidth;
      var infoTable = sdiv.querySelector(".info-table").querySelector("tbody");
      var infoTableHeader = sdiv.querySelector(".info-table").querySelector("thead");
      var fullTable = sdiv.querySelector(".pinout-table").querySelector("tbody");
      var fullTableHeader = sdiv.querySelector(".pinout-table").querySelector("thead");
      for (const column in columns) {
        var el = document.createElement("th");
        el.textContent = columns[column];
        infoTableHeader.appendChild(el);
        fullTableHeader.appendChild(el);
      }
      for (var i = 0; i < connector.pins.length; i++) {
        var pin = connector.pins[i];
        if (!pin.pin) {
          continue;
        }
        var pinfo = {};
        for (var ii = 0; ii < connector.info.pins.length; ii++) {
          if (connector.info.pins[ii].pin == pin.pin) {
            pinfo = connector.info.pins[ii];
            break;
          }
        }
        if (!pinfo.x) {
          addRow(fullTable, connector.pins[i], cid);
          continue;
        }
        var closest = 1000000;
        for (var ii = 0; ii < connector.info.pins.length; ii++) {
          var tinfo = connector.info.pins[ii];
          var distance = Math.pow((tinfo.x - pinfo.x), 2) + Math.pow((tinfo.y - pinfo.y), 2);
          if (tinfo.pin != pin.pin && (!closest || distance < closest)) {
            closest = distance;
          }
        }
        var pclone = ptemplate.content.cloneNode(true);
        var pdiv = pclone.querySelector("div");
        pdiv.textContent = pinfo.pin;
        pdiv.style.top = ((pinfo.y / imgHeight) * 100) + "%";
        pdiv.style.left = ((pinfo.x / imgWidth) * 100) + "%";
        pdiv.dataset.type = pin.type;
        pin.pdiv = pdiv;
        pdiv.addEventListener("click", function(table, pin, cid) {
          clickPin(table, pin, cid);
        }.bind(null, infoTable, pin, cid));
        closest = Math.sqrt(closest);
        var divheight = cdiv.clientHeight;
        var divwidth = cdiv.clientWidth;
        var mult = cdiv.querySelector("img").naturalHeight / divheight;
        var newheight = (closest / mult)
        var pxheight = divheight * 0.08;
        if (newheight < pxheight) {
          pxheight = newheight;
        }
        var height = (pxheight / divheight) * 100;
        var width = (pxheight / divwidth) * 100;
        pdiv.style.height = "calc(" + height + "% - 0.21vw)";
        pdiv.style.width = "calc(" +  width + "% - 0.21vw)";
        pdiv.style.marginTop = "-" + (width / 2) + "%";
        pdiv.style.marginLeft = "-" + (width / 2) + "%";
        pdiv.style.fontSize = (height * 1.8) + "px";
        pdiv.style.fontSize = (pxheight * 0.5) + "px";
        window.addEventListener('beforeprint', function(pdiv, width, divwidth, event) {
          pdiv.style.fontSize = "calc(calc(" + width + "px * min(640, "  + divwidth + ")) * 0.0055)";
        }.bind(null, pdiv, width, divwidth));
        window.addEventListener('afterprint', function(pdiv, pxheight, event) {
          pdiv.style.fontSize = (pxheight * 0.5) + "px";
        }.bind(null, pdiv, pxheight));
        cdiv.appendChild(pdiv);
        addRow(fullTable, pin, cid);
      }
      hideEmptyColumns(sdiv.querySelector('.pinout-table'));
      checkImagesLoaded();
    }.bind(null, connector, sdiv, img));
    if (typeof(connector.info) != "undefined") {
      img.src = connector.info.image.file;
      if (document.title.length == 0 && typeof(connector.info.title) != "undefined") {
        document.title = connector.info.title;
      }
      if (typeof(connector.info.board_url) != "undefined" && document.title.length > 0) {
        document.getElementById("board-link").innerText = document.title;
        document.getElementById("board-link").href = connector.info.board_url;
      }
      if (typeof(connector.info.name) != "undefined") {
        sdiv.querySelector(".connector-name").innerText = connector.info.name;
      }
    } else {
      img.parentElement.parentElement.style.height = 0;
      for (var i = 0; i < connector.pins.length; i++) {
        var pin = connector.pins[i];
        if (!pin.pin) {
          continue;
        }
        var fullTable = sdiv.querySelector(".pinout-table").querySelector("tbody");
        addRow(fullTable, pin);
      }
    }
  }
});
