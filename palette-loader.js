/* Modular palette loader. Add a JSON file and one entry to palettes/manifest.json. */
(() => {
  const fallback = {
    id: 'cute-muted', name: 'Cute & Muted', mood: 'soft, warm, gentle',
    interface: {page:'#F8F1F4',surface:'#FFFCFD',surfaceAlt:'#F1E3EA',ink:'#392A34',muted:'#786674',line:'#E1CCD8',accent:'#C879A8',accentInk:'#271521',header:'#392A34',headerInk:'#FFF9FC',highlight:'#F3D7E4'},
    categories: {Core:'#E8B7CB',Lecture:'#DCCEF0',Tutorial:'#B8D6C8',Lab:'#F0D1A3',GE:'#B8D8EA',AEC:'#EBC1B7',SEC:'#CEC8EB',DSE:'#E7D7B7',VAC:'#C1DDD8',Practical:'#D8C6DF',Other:'#E9E4E7'}
  };
  window.DU_PALETTES = {'cute-muted': fallback};
  window.DU_PALETTE_MANIFEST = [{id:'cute-muted', name:'Cute & Muted', mood:'soft, warm, gentle'}];
  window.DU_PALETTE_READY = (async () => {
    try {
      const manifestResponse = await fetch('./palettes/manifest.json');
      if (!manifestResponse.ok) throw new Error('Palette manifest could not be loaded');
      const manifest = await manifestResponse.json();
      const entries = Array.isArray(manifest.palettes) ? manifest.palettes : [];
      const loaded = await Promise.all(entries.map(async entry => {
        const response = await fetch('./palettes/' + entry.file);
        if (!response.ok) throw new Error('Could not load palette: ' + entry.file);
        const data = await response.json();
        if (!data.id || !data.interface || !data.categories) throw new Error('Invalid palette file: ' + entry.file);
        return [entry.id, {...data, name: entry.name || data.name, mood: entry.mood || data.mood}];
      }));
      window.DU_PALETTES = Object.fromEntries(loaded);
      window.DU_PALETTE_MANIFEST = entries;
      return window.DU_PALETTES;
    } catch (error) {
      console.warn('Palette files could not be loaded. Using the built-in starter palette.', error);
      window.DU_PALETTE_LOAD_ERROR = true;
      return window.DU_PALETTES;
    }
  })();
})();
