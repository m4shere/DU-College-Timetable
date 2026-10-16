
(() => {
  'use strict';
  const STORAGE_KEY = 'duCollegeTimetableBuilder.v2';
  const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const CATEGORIES = ['Core','Lecture','Tutorial','Lab','GE','AEC','SEC','DSE','VAC','Practical','Other'];
  const DEFAULT_PALETTE = 'paper';
  const $ = id => document.getElementById(id);
  let state = {
    metadata:{collegeName:'',courseName:'',semester:'',shift:'Morning',studentName:''},
    settings:{startTime:'08:00',periodMinutes:60,slotCount:11,palette:'paper'},
    classes:[], reminders:[]
  };
  let editingClassId = null;
  let editingReminderId = null;
  let nextClassId = 1;
  let nextReminderId = 1;
  let storageAvailable = true;
  try {
    const storageProbe = '__du_timetable_storage_test__';
    localStorage.setItem(storageProbe, '1');
    localStorage.removeItem(storageProbe);
  } catch (error) { storageAvailable = false; }

  function setStatus(id, message, error=false) {
    const el = $(id); el.textContent = message; el.classList.toggle('error', error);
  }
  function safeText(value) { return String(value ?? ''); }
  function trimValue(id) { return $(id).value.trim(); }
  function fmtTime(totalMinutes) {
    let mins = ((Number(totalMinutes) % 1440) + 1440) % 1440;
    let hour24 = Math.floor(mins / 60), minute = mins % 60;
    const suffix = hour24 >= 12 ? 'PM' : 'AM';
    const hour12 = hour24 % 12 || 12;
    return `${hour12}:${String(minute).padStart(2,'0')} ${suffix}`;
  }
  function startMinutes() {
    const parts = String(state.settings.startTime || '08:00').split(':').map(Number);
    return (parts[0] || 0) * 60 + (parts[1] || 0);
  }
  function slotStart(index) { return startMinutes() + index * Number(state.settings.periodMinutes); }
  function slotEnd(index) { return slotStart(index) + Number(state.settings.periodMinutes); }
  function timeRange(start, duration) {
    return `${fmtTime(slotStart(start))} – ${fmtTime(slotStart(start) + duration * Number(state.settings.periodMinutes))}`;
  }
  function slotHeading(index) { return `${fmtTime(slotStart(index))}–${fmtTime(slotEnd(index))}`; }
  function compactClock(totalMinutes, showMeridiem=true) {
    let mins=((Number(totalMinutes)%1440)+1440)%1440; const h24=Math.floor(mins/60), minute=mins%60;
    const h12=h24%12||12, suffix=h24>=12?'PM':'AM';
    const time=`${h12}${minute ? ':'+String(minute).padStart(2,'0') : ''}`;
    return showMeridiem ? `${time} ${suffix}` : time;
  }
  function compactSlotHeading(index) {
    const start=slotStart(index), end=slotEnd(index);
    const startSuffix=start%1440>=720?'PM':'AM', endSuffix=end%1440>=720?'PM':'AM';
    if(startSuffix===endSuffix) return `${compactClock(start,false)}–${compactClock(end,true)}`;
    return `${compactClock(start,true)}–${compactClock(end,true)}`;
  }
  function durationLabel(slots) {
    const total = slots * Number(state.settings.periodMinutes);
    if (total % 60 === 0) {
      const hours = total / 60;
      return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
    }
    return `${slots} ${slots === 1 ? 'slot' : 'slots'} · ${total} min`;
  }
  function formatDate(dateString, options={weekday:'short',day:'numeric',month:'short',year:'numeric'}) {
    if (!dateString) return 'No date';
    const [y,m,d] = dateString.split('-').map(Number);
    if (!y || !m || !d) return dateString;
    return new Intl.DateTimeFormat('en-IN', options).format(new Date(y,m-1,d));
  }
  function localDateString(date=new Date()) {
    const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,'0'),d=String(date.getDate()).padStart(2,'0');
    return `${y}-${m}-${d}`;
  }
  function reminderTimestamp(item) {
    return new Date(`${item.date}T${item.time || '23:59'}:00`).getTime();
  }
  function reminderStatus(item) {
    if (item.done) return 'Completed';
    const today = localDateString();
    if (item.date < today) return 'Overdue';
    if (item.date === today) return 'Today';
    return 'Upcoming';
  }
  function categoryColor(category, paletteName=null) {
    const name=paletteName || state.settings.palette || DEFAULT_PALETTE;
    const palette=(window.DU_PALETTES && window.DU_PALETTES[name]) || (window.DU_PALETTES && window.DU_PALETTES[DEFAULT_PALETTE]);
    return (palette && palette.colors && palette.colors[category]) || '#e9e7df';
  }
  function chosenColor(item) { return item.colour && item.colour !== 'auto' ? item.colour : categoryColor(item.category); }
  function renderLegend() {
    const holder=$('legend'); if(!holder) return;
    holder.querySelectorAll('[data-category]').forEach(el=>{
      el.style.backgroundColor=categoryColor(el.dataset.category);
      el.style.color='#20211f';
    });
  }
  function renderPalettePreview() {
    const holder=$('palettePreview'); if(!holder || !$('palette')) return;
    const paletteName=$('palette').value || DEFAULT_PALETTE;
    holder.replaceChildren();
    ['Core','Lecture','Tutorial','Lab','GE','AEC','SEC','DSE','VAC'].forEach(category=>{
      const chip=document.createElement('span'); chip.className='palette-chip';
      chip.style.backgroundColor=categoryColor(category,paletteName); chip.textContent=category;
      holder.appendChild(chip);
    });
  }
  function syncCustomColourVisibility() {
    const wrap=$('customColourWrap'); if(wrap) wrap.hidden=$('colour').value!=='custom';
  }

  function persist() {
    if (!storageAvailable) {
      $('settingsStatus').textContent = 'Browser storage is unavailable here. Download a backup to keep your work.';
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      $('settingsStatus').textContent = 'Auto-saved in this browser.';
    } catch (error) {
      $('settingsStatus').textContent = 'Auto-save failed in this browser. Download a backup to keep your work.';
    }
  }
  function loadSaved() {
    if (!storageAvailable) return false;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.classes)) return false;
      state = normalizeState(parsed);
      return true;
    } catch (error) { return false; }
  }
  function normalizeState(parsed) {
    const oldClasses = Array.isArray(parsed.classes) ? parsed.classes : [];
    const normalizedClasses = oldClasses.map((item,i) => ({
      id:Number.isFinite(Number(item.id)) ? Number(item.id) : i+1,
      day:DAYS.includes(item.day) ? item.day : 'Monday',
      start:Number(item.start), duration:Number(item.duration),
      short:safeText(item.short), room:safeText(item.room),
      teacherShort:safeText(item.teacherShort), category:safeText(item.category || 'Other'),
      fullSubject:safeText(item.fullSubject), teacherFull:safeText(item.teacherFull),
      extra:safeText(item.extra), colour:safeText(item.colour || 'auto')
    }));
    const incomingSettings = parsed.settings || {};
    const settings = {
      startTime:/^\d{2}:\d{2}$/.test(incomingSettings.startTime || '') ? incomingSettings.startTime : '08:00',
      periodMinutes:[30,45,50,60,75,90].includes(Number(incomingSettings.periodMinutes)) ? Number(incomingSettings.periodMinutes) : 60,
      slotCount:Math.max(6,Math.min(14,Number(incomingSettings.slotCount) || 11)),
      palette:(window.DU_PALETTES && window.DU_PALETTES[incomingSettings.palette]) ? incomingSettings.palette : DEFAULT_PALETTE
    };
    const maxRequired = normalizedClasses.reduce((n,item) => Math.max(n, Number(item.start||0)+Number(item.duration||0)), 6);
    settings.slotCount = Math.min(14,Math.max(settings.slotCount,maxRequired));
    const meta = parsed.metadata || {};
    const reminders = Array.isArray(parsed.reminders) ? parsed.reminders.map((item,i) => ({
      id:Number.isFinite(Number(item.id)) ? Number(item.id) : i+1,
      title:safeText(item.title), date:safeText(item.date), time:safeText(item.time),
      subject:safeText(item.subject), type:safeText(item.type || 'Other'), notes:safeText(item.notes), done:Boolean(item.done)
    })).filter(item => item.date && item.title) : [];
    return {
      metadata:{collegeName:safeText(meta.collegeName),courseName:safeText(meta.courseName),semester:safeText(meta.semester),shift:safeText(meta.shift || 'Morning'),studentName:safeText(meta.studentName)},
      settings, classes:normalizedClasses, reminders
    };
  }

  function fillMetadataForm() {
    $('collegeName').value=state.metadata.collegeName;
    $('courseName').value=state.metadata.courseName;
    $('semester').value=state.metadata.semester;
    $('shift').value=state.metadata.shift || 'Morning';
    $('studentName').value=state.metadata.studentName;
    $('startTime').value=state.settings.startTime;
    $('periodMinutes').value=String(state.settings.periodMinutes);
    $('slotCount').value=String(state.settings.slotCount);
    $('palette').value=state.settings.palette || DEFAULT_PALETTE;
    renderPalettePreview();
  }
  function updateSettingsFromForm() {
    const newSettings = {
      startTime:$('startTime').value || '08:00',
      periodMinutes:Number($('periodMinutes').value),
      slotCount:Number($('slotCount').value),
      palette: (window.DU_PALETTES && window.DU_PALETTES[$('palette').value]) ? $('palette').value : DEFAULT_PALETTE
    };
    const maxRequired = state.classes.reduce((max,item) => Math.max(max,item.start+item.duration),0);
    if (newSettings.slotCount < maxRequired) {
      setStatus('settingsStatus',`At least ${maxRequired} slots are needed for your existing classes. Remove or move the late class before shortening the day.`,true);
      $('slotCount').value=String(state.settings.slotCount);
      return false;
    }
    state.settings=newSettings;
    state.metadata={
      collegeName:trimValue('collegeName'),courseName:trimValue('courseName'),semester:$('semester').value,
      shift:$('shift').value,studentName:trimValue('studentName')
    };
    updateClassStartOptions();
    updateDurationOptions();
    renderAll(); persist();
    setStatus('settingsStatus','Timetable details and class timings updated.');
    return true;
  }

  function updateClassStartOptions(selectedValue=null) {
    const select=$('classStart');
    const oldValue=selectedValue === null ? Number(select.value || 0) : Number(selectedValue);
    select.replaceChildren();
    for (let i=0;i<state.settings.slotCount;i++) {
      const opt=document.createElement('option'); opt.value=String(i); opt.textContent=`${slotHeading(i)} · Slot ${i+1}`;
      select.appendChild(opt);
    }
    select.value=String(Math.min(Math.max(0,oldValue),state.settings.slotCount-1));
  }
  function updateDurationOptions(selectedValue=null) {
    const select=$('duration');
    const old=selectedValue===null ? Number(select.value || 1) : Number(selectedValue);
    const remaining=state.settings.slotCount-Number($('classStart').value||0);
    select.replaceChildren();
    for(let n=1;n<=Math.min(remaining,5);n++) {
      const option=document.createElement('option'); option.value=String(n);
      option.textContent=`${n} ${n===1?'slot':'slots'} · ${durationLabel(n)}`;
      select.appendChild(option);
    }
    select.value=String(Math.min(Math.max(1,old),Math.min(remaining,5)));
    $('durationHint').textContent=`One slot = ${state.settings.periodMinutes} minutes. This timetable has ${state.settings.slotCount} slots per day.`;
  }
  function getClassFormData() {
    return {
      id:editingClassId===null ? nextClassId++ : editingClassId,
      day:$('classDay').value,start:Number($('classStart').value),duration:Number($('duration').value),
      short:trimValue('short'),room:trimValue('room'),teacherShort:trimValue('teacherShort'),category:$('category').value,
      fullSubject:trimValue('fullSubject'),teacherFull:trimValue('teacherFull'),extra:trimValue('extra'),colour:$('colour').value==='custom' ? $('customColour').value : 'auto'
    };
  }
  function resetClassForm() {
    $('classForm').reset(); editingClassId=null;
    $('classFormHeading').textContent='Add a class'; $('saveClass').textContent='Add class'; $('cancelClassEdit').hidden=true;
    $('classStart').value='0'; updateDurationOptions(1); syncCustomColourVisibility();
  }
  function classDetails(item) {
    return [
      ['Subject',item.fullSubject || item.short],['Short form',item.short],['Teacher',item.teacherFull || item.teacherShort],
      ['Teacher initials',item.teacherShort],['Room',item.room],['Category',item.category],['Day',item.day],
      ['Time',timeRange(item.start,item.duration)],['Duration',durationLabel(item.duration)],['Extra information',item.extra]
    ].filter(pair => pair[1] !== undefined && pair[1] !== null && String(pair[1]).trim() !== '');
  }
  function openDetails(title, pairs) {
    $('dialogTitle').textContent=title;
    const holder=$('dialogLines'); holder.replaceChildren();
    pairs.forEach(([label,value])=>{
      const row=document.createElement('div'); row.className='detail-line';
      const strong=document.createElement('strong'); strong.textContent=label;
      const span=document.createElement('span'); span.textContent=String(value);
      row.append(strong,span); holder.appendChild(row);
    });
    const dlg=$('detailDialog');
    if (typeof dlg.showModal==='function') dlg.showModal(); else alert(pairs.map(p=>p[0]+': '+p[1]).join('\n'));
  }
  function makeClassButton(item, mobile=false) {
    const card=document.createElement('button'); card.type='button';
    card.className=mobile?'mobile-class-card':'class-card'; card.style.backgroundColor=chosenColor(item);
    const detailText=classDetails(item).map(([k,v])=>`${k}: ${v}`).join('\n'); card.title=detailText;
    card.setAttribute('aria-label',`${item.short}. ${detailText.replace(/\n/g,'. ')}`);
    const short=document.createElement('span'); short.className='subject-short'; short.textContent=item.short || 'Subject';
    const shortLength=String(item.short||'').trim().length;
    if(shortLength<=4) short.classList.add('short-xs'); else if(shortLength<=7) short.classList.add('short-sm'); else if(shortLength<=10) short.classList.add('short-md'); else short.classList.add('short-long');
    card.appendChild(short);
    if(item.room){const room=document.createElement('span');room.className='room';room.textContent=`Room ${item.room}`;card.appendChild(room);}
    if(item.teacherShort){const t=document.createElement('span');t.className='teacher-short';t.textContent=item.teacherShort;card.appendChild(t);}
    const cat=document.createElement('span');cat.className='category';cat.textContent=item.category;card.appendChild(cat);
    card.addEventListener('click',()=>openDetails(item.fullSubject||item.short,classDetails(item)));
    return card;
  }
  function visibleDays() {
    return DAYS.filter(day => day!=='Saturday' || $('showSaturday').checked).filter(day => day!=='Sunday' || $('showSunday').checked);
  }
  function renderDesktopTable() {
    const header=$('timeHeader'); header.replaceChildren();
    const dayTh=document.createElement('th');dayTh.textContent='Day';header.appendChild(dayTh);
    for(let i=0;i<state.settings.slotCount;i++){const th=document.createElement('th');th.className='time-head';th.textContent=compactSlotHeading(i);th.title=slotHeading(i);header.appendChild(th);}
    const body=$('tableBody');body.replaceChildren();
    visibleDays().forEach(day=>{
      const tr=document.createElement('tr');const dayCell=document.createElement('th');dayCell.className='day';dayCell.scope='row';dayCell.textContent=day;tr.appendChild(dayCell);
      const dayClasses=state.classes.filter(x=>x.day===day).sort((a,b)=>a.start-b.start);
      const byStart=new Map(dayClasses.map(x=>[x.start,x]));let slot=0;
      while(slot<state.settings.slotCount){
        const item=byStart.get(slot);
        if(item && item.start+item.duration<=state.settings.slotCount){
          const td=document.createElement('td');td.className='slot';td.colSpan=item.duration;td.appendChild(makeClassButton(item,false));tr.appendChild(td);slot+=item.duration;
        }else{
          const td=document.createElement('td');td.className='slot empty-cell';td.textContent='—';tr.appendChild(td);slot++;
        }
      }
      body.appendChild(tr);
    });
  }
  function renderMobileSchedule() {
    const holder=$('mobileSchedule');holder.replaceChildren();
    visibleDays().forEach(day=>{
      const section=document.createElement('section');section.className='mobile-day';
      const heading=document.createElement('div');heading.className='mobile-day-heading';
      const title=document.createElement('span');title.textContent=day;
      const count=state.classes.filter(item=>item.day===day).length;
      const countEl=document.createElement('small');countEl.textContent=count===1?'1 class':`${count} classes`;heading.append(title,countEl);section.appendChild(heading);
      const dayClasses=state.classes.filter(item=>item.day===day).sort((a,b)=>a.start-b.start);
      if(!dayClasses.length){const empty=document.createElement('div');empty.className='mobile-empty';empty.textContent='No classes scheduled';section.appendChild(empty);}
      dayClasses.forEach(item=>{
        const row=document.createElement('div');row.className='mobile-class';
        const time=document.createElement('div');time.className='mobile-time';
        const startTime=document.createElement('span');startTime.className='time-part';startTime.textContent=fmtTime(slotStart(item.start)).replace(' ','\u00a0');
        const divider=document.createElement('span');divider.className='time-divider';divider.textContent='to';
        const endTime=document.createElement('span');endTime.className='time-part';endTime.textContent=fmtTime(slotStart(item.start+item.duration)).replace(' ','\u00a0');
        const duration=document.createElement('small');duration.textContent=durationLabel(item.duration);
        time.append(startTime,divider,endTime,duration);
        row.append(time,makeClassButton(item,true));section.appendChild(row);
      });
      holder.appendChild(section);
    });
  }
  function renderClassList() {
    const holder=$('classList');holder.replaceChildren();$('classCount').textContent=`${state.classes.length} ${state.classes.length===1?'class':'classes'}`;
    if(!state.classes.length){const p=document.createElement('p');p.className='hint';p.textContent='Nothing added yet. Add your first class using the form above.';holder.appendChild(p);return;}
    [...state.classes].sort((a,b)=>DAYS.indexOf(a.day)-DAYS.indexOf(b.day)||a.start-b.start).forEach(item=>{
      const row=document.createElement('div');row.className='entry';const info=document.createElement('div');info.className='entry-info';
      const strong=document.createElement('strong');strong.textContent=`${item.day} · ${item.short}`;
      const small=document.createElement('small');small.textContent=`${timeRange(item.start,item.duration)} · ${item.category}${item.room?' · Room '+item.room:''}`;info.append(strong,small);
      const actions=document.createElement('div');actions.className='entry-actions';
      const edit=document.createElement('button');edit.type='button';edit.className='secondary small';edit.textContent='Edit';edit.addEventListener('click',()=>editClass(item.id));
      const del=document.createElement('button');del.type='button';del.className='danger small';del.textContent='Delete';del.addEventListener('click',()=>{
        state.classes=state.classes.filter(x=>x.id!==item.id);if(editingClassId===item.id)resetClassForm();renderAll();persist();setStatus('classStatus','Class deleted.');
      });
      actions.append(edit,del);row.append(info,actions);holder.appendChild(row);
    });
  }
  function editClass(id) {
    const item=state.classes.find(x=>x.id===id);if(!item)return;editingClassId=id;
    $('classDay').value=item.day;updateClassStartOptions(item.start);$('classStart').value=String(item.start);updateDurationOptions(item.duration);
    ['short','room','teacherShort','category','fullSubject','teacherFull','extra'].forEach(key=>$(key).value=item[key]??'');
    if(item.colour && item.colour!=='auto') { $('colour').value='custom'; $('customColour').value=/^#[0-9a-f]{6}$/i.test(item.colour)?item.colour:'#e5e9d8'; }
    else { $('colour').value='auto'; }
    syncCustomColourVisibility();
    $('classFormHeading').textContent='Edit class';$('saveClass').textContent='Save changes';$('cancelClassEdit').hidden=false;setStatus('classStatus',`Editing ${item.short}.`);
    $('classFormHeading').scrollIntoView({behavior:'smooth',block:'center'});
  }
  function hasOverlap(candidate,ignoreId=null) {
    const start=candidate.start,end=start+candidate.duration;
    return state.classes.some(existing=>existing.id!==ignoreId&&existing.day===candidate.day&&start<existing.start+existing.duration&&existing.start<end);
  }
  function renderMetadata() {
    const m=state.metadata;
    $('displayTitle').textContent=m.collegeName?m.collegeName:'My College Timetable';
    const pieces=[m.courseName,m.semester,m.shift?`${m.shift} college`: '',m.studentName?`For ${m.studentName}`:''].filter(Boolean);
    $('displayMeta').textContent=pieces.join(' · ') || 'Add your course and semester in the editor.';
    const end=fmtTime(startMinutes()+state.settings.slotCount*state.settings.periodMinutes);
    $('displayTiming').textContent=`${fmtTime(startMinutes())} – ${end} · ${state.settings.slotCount} slots · ${state.settings.periodMinutes}-minute periods`;
    document.title=(m.collegeName?m.collegeName+' · ':'')+'DU College Timetable Builder';
  }

  function reminderPairs(item) {
    return [['Reminder',item.title],['Date',formatDate(item.date,{weekday:'long',day:'numeric',month:'long',year:'numeric'})],['Time',item.time?fmtTime(item.time.split(':').reduce((h,m,i)=>h*60+Number(m),0)):'Not specified'],['Subject',item.subject],['Type',item.type],['Notes',item.notes]]
      .filter(([k,v])=>v!==undefined&&v!==null&&String(v).trim()!=='');
  }
  function renderReminders() {
    const holder=$('reminderList');holder.replaceChildren();
    const sorted=[...state.reminders].sort((a,b)=>Number(a.done)-Number(b.done)||reminderTimestamp(a)-reminderTimestamp(b));
    const pending=state.reminders.filter(item=>!item.done).length;
    $('reminderCount').textContent=`${pending} pending`;
    $('noReminders').hidden=state.reminders.length>0;
    sorted.forEach(item=>{
      const card=document.createElement('article');card.className='reminder'+(item.done?' done-item':'');
      const date=new Date(`${item.date}T12:00:00`);
      const mark=document.createElement('div');mark.className='reminder-mark';
      const day=document.createElement('span');day.textContent=String(date.getDate());const month=document.createElement('small');month.textContent=date.toLocaleDateString('en-IN',{month:'short'});mark.append(day,month);
      const content=document.createElement('div');content.className='reminder-content';
      const topline=document.createElement('div');topline.className='reminder-topline';const title=document.createElement('strong');title.textContent=item.title;topline.appendChild(title);
      const badge=document.createElement('span');const st=reminderStatus(item);badge.className='reminder-badge'+(st==='Overdue'?' overdue':st==='Completed'?' done':'');badge.textContent=st;topline.appendChild(badge);
      const type=document.createElement('span');type.className='reminder-badge';type.textContent=item.type||'Other';topline.appendChild(type);
      content.appendChild(topline);
      if(item.subject){const subj=document.createElement('div');subj.className='reminder-meta';subj.textContent=`Subject: ${item.subject}`;content.appendChild(subj);}
      if(item.notes){const note=document.createElement('p');note.textContent=item.notes;content.appendChild(note);}
      const meta=document.createElement('div');meta.className='reminder-meta';meta.textContent=`${formatDate(item.date,{weekday:'short',day:'numeric',month:'short',year:'numeric'})}${item.time?' · '+fmtTime(item.time.split(':').reduce((h,m)=>h*60+Number(m),0)):''}`;content.appendChild(meta);
      const controls=document.createElement('div');controls.className='reminder-controls no-print';
      const done=document.createElement('button');done.type='button';done.className='secondary small';done.textContent=item.done?'Mark pending':'Mark done';done.addEventListener('click',()=>{item.done=!item.done;renderAll();persist();});
      const edit=document.createElement('button');edit.type='button';edit.className='secondary small';edit.textContent='Edit';edit.addEventListener('click',()=>editReminder(item.id));
      const del=document.createElement('button');del.type='button';del.className='danger small';del.textContent='Delete';del.addEventListener('click',()=>{state.reminders=state.reminders.filter(x=>x.id!==item.id);if(editingReminderId===item.id)resetReminderForm();renderAll();persist();setStatus('reminderStatus','Reminder deleted.');});
      controls.append(done,edit,del);content.appendChild(controls);card.append(mark,content);holder.appendChild(card);
    });
  }
  function getReminderFormData() {
    return {id:editingReminderId===null?nextReminderId++:editingReminderId,title:trimValue('reminderTitle'),date:$('reminderDate').value,time:$('reminderTime').value,subject:trimValue('reminderSubject'),type:$('reminderType').value,notes:trimValue('reminderNotes'),done:false};
  }
  function resetReminderForm() {
    $('reminderForm').reset();editingReminderId=null;$('reminderFormHeading').textContent='Add a reminder';$('saveReminder').textContent='Add reminder';$('cancelReminderEdit').hidden=true;
    $('reminderDate').value=localDateString();
  }
  function editReminder(id) {
    const item=state.reminders.find(x=>x.id===id);if(!item)return;editingReminderId=id;
    $('reminderTitle').value=item.title;$('reminderDate').value=item.date;$('reminderTime').value=item.time;$('reminderSubject').value=item.subject;$('reminderType').value=item.type;$('reminderNotes').value=item.notes;
    $('reminderFormHeading').textContent='Edit reminder';$('saveReminder').textContent='Save changes';$('cancelReminderEdit').hidden=false;
    $('reminderEditor').scrollIntoView({behavior:'smooth',block:'start'});$('reminderTitle').focus();
  }
  function renderAll() {
    renderMetadata();renderDesktopTable();renderMobileSchedule();renderClassList();renderReminders();renderLegend();
  }

  $('settingsForm').addEventListener('submit',event=>{event.preventDefault();updateSettingsFromForm();});
  document.querySelectorAll('[data-preset-start]').forEach(button=>button.addEventListener('click',()=>{
    $('startTime').value=button.dataset.presetStart;$('shift').value=button.dataset.presetShift;updateSettingsFromForm();
  }));
  $('classStart').addEventListener('change',()=>updateDurationOptions(1));
  $('palette').addEventListener('change',renderPalettePreview);
  $('colour').addEventListener('change',syncCustomColourVisibility);
  $('quickBackupBtn').addEventListener('click',()=>$('exportBtn').click());
  $('classForm').addEventListener('submit',event=>{
    event.preventDefault();const item=getClassFormData();
    if(!item.short){setStatus('classStatus','Enter a subject short form.',true);return;}
    if(item.start+item.duration>state.settings.slotCount){setStatus('classStatus','This class goes past the last time slot. Choose an earlier start or shorter duration.',true);return;}
    if(hasOverlap(item,editingClassId)){setStatus('classStatus',`Time conflict: another class overlaps on ${item.day}.`,true);return;}
    if(editingClassId!==null){state.classes=state.classes.map(x=>x.id===editingClassId?item:x);setStatus('classStatus','Class updated.');}
    else{state.classes.push(item);setStatus('classStatus','Class added.');}
    resetClassForm();renderAll();persist();
  });
  $('cancelClassEdit').addEventListener('click',()=>{resetClassForm();setStatus('classStatus','Edit cancelled.');});
  $('clearClassForm').addEventListener('click',()=>{resetClassForm();setStatus('classStatus','Form cleared.');});
  $('showSaturday').addEventListener('change',renderAll);$('showSunday').addEventListener('change',renderAll);
  $('printBtn').addEventListener('click',()=>window.print());
  $('closeDialog').addEventListener('click',()=> $('detailDialog').close());
  $('clearAll').addEventListener('click',()=>{
    if(confirm('Clear all classes and reminders? Your timetable details and timing settings will stay. Download a backup first if needed.')){
      state.classes=[];state.reminders=[];resetClassForm();resetReminderForm();renderAll();persist();setStatus('classStatus','Classes and reminders cleared.');
    }
  });
  $('exportBtn').addEventListener('click',()=>{
    const payload={format:'du-college-timetable-builder-v2',exportedAt:new Date().toISOString(),...state};
    const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;a.download='du-college-timetable-backup.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    setStatus('classStatus','Backup downloaded. Keep it somewhere safe.');
  });
  $('importBtn').addEventListener('click',()=>$('importFile').click());
  $('importFile').addEventListener('change',async event=>{
    const file=event.target.files[0];if(!file)return;
    try{
      const parsed=JSON.parse(await file.text());
      const incoming=Array.isArray(parsed)?{classes:parsed}:parsed;
      if(!Array.isArray(incoming.classes))throw new Error('This file does not contain a timetable class list.');
      const fresh=normalizeState(incoming);
      const valid=fresh.classes.every(item=>item.short&&Number.isInteger(item.start)&&item.start>=0&&Number.isInteger(item.duration)&&item.duration>0&&item.start+item.duration<=fresh.settings.slotCount&&DAYS.includes(item.day));
      if(!valid)throw new Error('One or more classes have invalid time, day, duration or short form.');
      for(let i=0;i<fresh.classes.length;i++){
        if(fresh.classes.slice(i+1).some(other=>other.day===fresh.classes[i].day&&fresh.classes[i].start<other.start+other.duration&&other.start<fresh.classes[i].start+fresh.classes[i].duration))throw new Error('This backup has overlapping classes.');
      }
      state=fresh;nextClassId=Math.max(0,...state.classes.map(x=>x.id))+1;nextReminderId=Math.max(0,...state.reminders.map(x=>x.id))+1;
      fillMetadataForm();updateClassStartOptions(0);updateDurationOptions(1);resetClassForm();resetReminderForm();renderAll();persist();setStatus('classStatus','Backup imported successfully.');
    }catch(error){setStatus('classStatus','Import failed: '+error.message,true);}
    event.target.value='';
  });
  $('shareBtn').addEventListener('click',async()=>{
    const url=window.location.href;
    if(window.location.protocol==='file:'){
      $('shareStatus').textContent='This page is still a local file. Host it online first, then this button can share the public website link. Use Print / Save PDF to share today.';
      return;
    }
    try{
      if(navigator.share){await navigator.share({title:'DU College Timetable Builder',text:'Create and customise your college timetable.',url});$('shareStatus').textContent='Share menu opened.';}
      else if(navigator.clipboard&&navigator.clipboard.writeText){await navigator.clipboard.writeText(url);$('shareStatus').textContent='Website link copied. Paste it into WhatsApp or a group chat.';}
      else{$('shareStatus').textContent='Copy this website address from your browser bar: '+url;}
    }catch(error){if(error.name!=='AbortError')$('shareStatus').textContent='Share was not completed. You can copy the website address from your browser bar.';}
  });
  $('reminderForm').addEventListener('submit',event=>{
    event.preventDefault();const item=getReminderFormData();
    if(!item.title||!item.date){setStatus('reminderStatus','Enter a reminder title and date.',true);return;}
    if(editingReminderId!==null){const old=state.reminders.find(x=>x.id===editingReminderId);item.done=old?old.done:false;state.reminders=state.reminders.map(x=>x.id===editingReminderId?item:x);setStatus('reminderStatus','Reminder updated.');}
    else{state.reminders.push(item);setStatus('reminderStatus','Reminder added.');}
    resetReminderForm();renderAll();persist();
  });
  $('cancelReminderEdit').addEventListener('click',()=>{resetReminderForm();setStatus('reminderStatus','Edit cancelled.');});
  $('clearReminderForm').addEventListener('click',()=>{resetReminderForm();setStatus('reminderStatus','Reminder form cleared.');});
  $('demoBtn').addEventListener('click',()=>{
    state.metadata={collegeName:'Example DU College',courseName:'B.Sc. Physical Science with Computer Science',semester:'Semester IV',shift:'Morning',studentName:''};
    state.settings={startTime:'08:30',periodMinutes:60,slotCount:11,palette:'paper'};
    state.classes=[
      {id:1,day:'Monday',start:0,duration:1,short:'RA',room:'204',teacherShort:'AS',category:'Core',fullSubject:'Elements of Real Analysis',teacherFull:'Dr. Anil Sharma',extra:'Bring lecture notes.',colour:'auto'},
      {id:2,day:'Monday',start:3,duration:2,short:'CS LAB',room:'Lab 2',teacherShort:'RV',category:'Lab',fullSubject:'Computer Science Practical',teacherFull:'Mr. R. Verma',extra:'Two-hour practical.',colour:'auto'},
      {id:3,day:'Tuesday',start:1,duration:1,short:'DSA',room:'301',teacherShort:'PK',category:'Lecture',fullSubject:'Data Structures and Algorithms',teacherFull:'Dr. Priya Kumar',extra:'Review linked lists.',colour:'auto'},
      {id:4,day:'Tuesday',start:5,duration:3,short:'PHY LAB',room:'Physics Lab',teacherShort:'NK',category:'Practical',fullSubject:'Physics Laboratory',teacherFull:'Dr. N. Khan',extra:'Three-slot laboratory.',colour:'auto'},
      {id:5,day:'Wednesday',start:2,duration:1,short:'GE',room:'110',teacherShort:'MS',category:'GE',fullSubject:'Generic Elective',teacherFull:'Ms. Meera Singh',extra:'',colour:'auto'},
      {id:6,day:'Thursday',start:4,duration:1,short:'AEC',room:'205',teacherShort:'SG',category:'AEC',fullSubject:'Ability Enhancement Course',teacherFull:'Ms. S. Gupta',extra:'',colour:'auto'},
      {id:7,day:'Friday',start:6,duration:2,short:'DSE',room:'212',teacherShort:'AS',category:'DSE',fullSubject:'Discipline Specific Elective',teacherFull:'Dr. Anil Sharma',extra:'',colour:'auto'}
    ];
    state.reminders=[
      {id:1,title:'Submit practical file',date:localDateString(new Date(Date.now()+2*86400000)),time:'11:00',subject:'Physics Lab',type:'Practical file',notes:'Check that diagrams and observations are complete.',done:false},
      {id:2,title:'Prepare for class test',date:localDateString(new Date(Date.now()+5*86400000)),time:'09:30',subject:'Data Structures',type:'Test / Exam',notes:'Revise stacks, queues and linked lists.',done:false}
    ];
    nextClassId=8;nextReminderId=3;fillMetadataForm();updateClassStartOptions(0);updateDurationOptions(1);resetClassForm();resetReminderForm();renderAll();persist();
    setStatus('classStatus','Sample loaded. Replace the example details with your own.');
  });

  function setupContactLinks() {
    const contacts = window.DU_CONTACTS || {};
    const email = String(contacts.email || '').trim();
    const instagram = String(contacts.instagram || '').trim();
    const reddit = String(contacts.reddit || '').trim();
    const links = [
      { id: 'contactEmail', value: email, url: value => 'mailto:' + value.replace(/^mailto:/i, '').trim() },
      { id: 'contactInstagram', value: instagram, url: value => /^https?:\/\//i.test(value) ? value : 'https://www.instagram.com/' + value.replace(/^@/, '') + '/' },
      { id: 'contactReddit', value: reddit, url: value => /^https?:\/\//i.test(value) ? value : 'https://www.reddit.com/user/' + value.replace(/^(u\/|@)/, '') + '/' }
    ];
    let complete = 0;
    links.forEach(item => {
      const el = $(item.id);
      if (!el) return;
      if (item.value) {
        el.href = item.url(item.value);
        el.removeAttribute('aria-disabled');
        el.classList.remove('contact-link-disabled');
        el.title = item.id === 'contactEmail' ? 'Email the creator' : 'Open creator profile';
        if (item.id !== 'contactEmail') { el.target = '_blank'; el.rel = 'noopener noreferrer'; }
        complete++;
      } else {
        el.href = '#contact';
        el.setAttribute('aria-disabled', 'true');
        el.classList.add('contact-link-disabled');
        el.title = 'Add this contact in contact-config.js';
        el.addEventListener('click', event => event.preventDefault());
      }
    });
    const hint = $('contactHint');
    if (hint) {
      hint.hidden = complete === 3;
      hint.textContent = email ? 'If your email app does not open, copy the address from contact-config.js and open your email provider manually.' : 'Add your email and social usernames in contact-config.js before publishing.';
    }
    const redditIcon = $('contactReddit')?.querySelector('svg');
    if (redditIcon) redditIcon.innerHTML = '<circle cx="12" cy="12" r="10" fill="#FF4500" stroke="none"/><path d="M15.7 9.2a1.25 1.25 0 1 1 2.1 1.3c.12.45.2.93.2 1.42 0 2.65-2.68 4.8-6 4.8s-6-2.15-6-4.8c0-.5.08-.97.2-1.42a1.25 1.25 0 1 1 1.9-1.48c1-.65 2.28-1.03 3.68-1.03.5 0 .98.05 1.44.15l.86-4.05 3.1.66-.28 1.28-2.05-.44-.77 3.61c.6.2 1.16.48 1.62.82Z" fill="#fff" stroke="none"/><circle cx="10" cy="12" r=".8" fill="#FF4500" stroke="none"/><circle cx="14" cy="12" r=".8" fill="#FF4500" stroke="none"/><path d="M10.2 14c1.1.75 2.5.75 3.6 0" fill="none" stroke="#FF4500" stroke-width=".9" stroke-linecap="round"/>';
    const year = $('footerYear');
    if (year) year.textContent = String(new Date().getFullYear());
  }
  setupContactLinks();
  if('serviceWorker' in navigator && /^https?:$/.test(window.location.protocol)) {
    window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
  }

  if(!loadSaved()) {
    // Start with a clean timetable and sensible defaults.
    state.settings={startTime:'08:00',periodMinutes:60,slotCount:11,palette:'paper'};
  }
  nextClassId=Math.max(0,...state.classes.map(x=>x.id))+1;
  nextReminderId=Math.max(0,...state.reminders.map(x=>x.id))+1;
  fillMetadataForm();updateClassStartOptions(0);updateDurationOptions(1);resetClassForm();resetReminderForm();renderAll();
  $('settingsStatus').textContent = storageAvailable ? 'Auto-save is on for this browser. Download a backup before changing devices.' : 'Browser storage is unavailable here. Download a backup to keep your work.';
})();
