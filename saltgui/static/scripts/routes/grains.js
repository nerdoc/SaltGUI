class GrainsRoute extends PageRoute {

  constructor(router) {
    super("^[\/]grains$", "Grains", "#page_grains", "#button_grains", router);

    this.keysLoaded = false;
    this.jobsLoaded = false;

    this._updateKeys = this._updateKeys.bind(this);
    this._updateMinion = this._updateMinion.bind(this);

    // collect the list of displayed minions
    let previewGrainsText = window.localStorage.getItem("preview_grains");
    if(!previewGrainsText || previewGrainsText === "undefined") {
      previewGrainsText = "[]";
    }
    this._previewGrains = JSON.parse(previewGrainsText);
    if(!Array.isArray(this._previewGrains)) {
      this._previewGrains = [ ];
    }
    // add all the required columns
    const tr = document.querySelector("#page_grains thead tr");
    while(tr.childElementCount > 6) {
      tr.removeChild(tr.lastChild);
    }
    for(let i = 0; i < this._previewGrains.length; i++) {
      const th = document.createElement("th");
      th.innerText = this._previewGrains[i];
      tr.appendChild(th);
    }
    // the new columns are not yet sortable, make sure they are
    sorttable.makeSortable(document.querySelector("#page_grains table"));
  }

  onShow() {
    const minions = this;

    return new Promise(function(resolve, reject) {
      minions.resolvePromise = resolve;
      if(minions.keysLoaded && minions.jobsLoaded) resolve();
      minions.router.api.getMinions().then(minions._updateMinions);
      minions.router.api.getKeys().then(minions._updateKeys);
      minions.router.api.getJobs().then(minions._updateJobs);
      minions.router.api.getJobsActive().then(minions._runningJobs);
    });
  }

  _updateKeys(data) {
    const keys = data.return;

    const list = this.getPageElement().querySelector('#minions');

    const hostnames = keys.minions.sort();
    for(const hostname of hostnames) {
      this._addMinion(list, hostname, 1 + this._previewGrains.length);

      // preliminary dropdown menu
      const element = document.getElementById(hostname);
      const menu = new DropDownMenu(element);
      this._addMenuItemShowGrains(menu, hostname);

      for(let i = 0; i < this._previewGrains.length; i++) {
        element.appendChild(Route._createTd("", ""));
      }
    }

    this.keysLoaded = true;
    if(this.keysLoaded && this.jobsLoaded) this.resolvePromise();
  }

  _updateOfflineMinion(container, hostname) {
    super._updateOfflineMinion(container, hostname);

    const element = document.getElementById(hostname);

    // force same columns on all rows
    element.appendChild(Route._createTd("saltversion", ""));
    element.appendChild(Route._createTd("os", ""));
    element.appendChild(Route._createTd("graininfo", ""));
    element.appendChild(Route._createTd("run-command-button", ""));
    for(let i = 0; i < this._previewGrains.length; i++) {
      element.appendChild(Route._createTd("", ""));
    }
  }

  _updateMinion(container, minion, hostname) {
    super._updateMinion(container, minion, hostname);

    const element = document.getElementById(hostname);

    const cnt = Object.keys(minion).length;
    const grainInfoText = cnt + " grains";
    const grainInfoTd = Route._createTd("graininfo", grainInfoText);
    grainInfoTd.setAttribute("sorttable_customkey", cnt);
    element.appendChild(grainInfoTd);

    const menu = new DropDownMenu(element);
    this._addMenuItemShowGrains(menu, hostname);

    // add all the required columns
    while(element.childElementCount > 6) {
      element.removeChild(element.lastChild);
    }
    for(let i = 0; i < this._previewGrains.length; i++) {
      const td = document.createElement("td");
      const grainName = this._previewGrains[i];
      if(grainName in minion) {
        td.innerText = Output.formatObject(minion[grainName]);
        td.classList.add("grain_value");
      }
      element.appendChild(td);
    }
  }

  _addMenuItemShowGrains(menu, hostname) {
    menu.addMenuItem("Show&nbsp;grains", function(evt) {
      window.location.assign("grainsminion?minion=" + encodeURIComponent(hostname));
    }.bind(this));
  }
}
