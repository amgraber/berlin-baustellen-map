// Offline German → English translation for the (fairly formulaic) traffic texts
// in the VIZ / GDI data. No external service: an exact-phrase dictionary plus a
// few pattern rules. Anything not fully covered stays German rather than
// becoming a half-translated mix. Add phrases to PHRASES as you spot them.

// Short labels: kind, restriction (severity / einschr), direction.
export const TERMS = {
  Vollsperrung: 'Full closure',
  Fahrtrichtungssperrung: 'One direction closed',
  'keine Sperrung': 'No closure',
  Haltverbote: 'No-parking zone',
  'keine Fahrbahn-Einschränkung': 'No carriageway restriction',
  Fahrbahneinengung: 'Carriageway narrowed',
  'Fahrstreifen-Reduzierung': 'Fewer lanes',
  'Fahrstreifen-Verschwenkung': 'Lanes shifted',
  Gehwegvollsperrung: 'Sidewalk closed',
  'Vollsperrung beider Fahrbahnen': 'Full closure, both directions',
  'Sperrung einer Fahrtrichtung': 'One direction closed',
  Gegenverkehrsregelung: 'Alternating one-lane traffic',
  'Gegenverkehrsanlage (LZA)': 'Alternating traffic (signals)',
  'Sicherung nach Regelplan': 'Standard work-zone setup',
  'Sicherung gemäß Vz.-plan': 'Signage plan in place',
  'geänderte Führung im Knotenpunkt': 'Changed layout at junction',
  Intervallsperrung: 'Intermittent closure',
  Umleitung: 'Detour',
  Fahrbahnmindestbreite: 'Minimum carriageway width',
  'verbleibende Fahrstreifen': 'Remaining lanes',
  Baustelle: 'Construction site',
  Bauarbeiten: 'Construction work',
  Arbeitsstelle: 'Work site',
  'sonstige Ereignisse': 'Other event',
  Sperrung: 'Closure',
  Gefahr: 'Hazard',
  Störung: 'Disruption',
  Stau: 'Congestion',
  Unfall: 'Accident',
  Fahrstreifensperrung: 'Lane closure',
  Beidseitig: 'Both directions',
  Einseitig: 'One direction',
};

// Exact phrases (matched case-insensitively, after trimming).
const PHRASES = {
  'bauarbeiten': 'construction work',
  'geplante bauarbeiten': 'planned construction work',
  'bvg bauarbeiten': 'BVG construction work',
  'baustelle': 'construction site',
  'baustellen': 'construction sites',
  'baustelleneinrichtung': 'site setup',
  'baustellenfläche für eine hochbaustelle': 'site area for a building project',
  'gesperrt': 'closed',
  'arbeiten': 'works',
  'leitungsarbeiten': 'utility line works',
  'leitungsarbeiten als wanderbaustelle': 'utility line works (moving site)',
  'leitungsbau': 'utility line construction',
  'leitungsbauarbeiten': 'utility line construction',
  'leitungsbauarbeiten der wasserbetriebe': 'Berliner Wasserbetriebe pipe works',
  'tiefbauarbeiten': 'civil engineering works',
  'gleisbauarbeiten': 'track works',
  'gleisbauarbeiten db/stadtbahn': 'track works (DB / S-Bahn)',
  'gleisarbeiten': 'track works',
  'gleis- und leitungsarbeiten': 'track and utility works',
  'brückenarbeiten': 'bridge works',
  'brückenbauarbeiten': 'bridge construction',
  'brückenbau': 'bridge construction',
  'brückenneubau': 'new bridge construction',
  'brückensanierung': 'bridge renovation',
  'brückeninstandsetzung': 'bridge repairs',
  'brückenprüfung': 'bridge inspection',
  'brückenschäden': 'bridge damage',
  'stromnetzarbeiten': 'power grid works',
  'stromleitungsbau': 'power line works',
  'stromleitungsarbeiten': 'power line works',
  'stromleitungsbauarbeiten': 'power line works',
  'hochbau': 'building construction',
  'hochbauarbeiten': 'building construction',
  'hochbaustelle': 'building construction site',
  'hochbaumaßnahme': 'building construction',
  'hausneubau': 'new building construction',
  'dachausbau': 'loft conversion',
  'dachausbau und balkonmontage': 'loft conversion and balcony installation',
  'gebäudesanierung': 'building renovation',
  'straßenarbeiten': 'road works',
  'straßenbau': 'road construction',
  'straßensanierung': 'road renovation',
  'straßenschäden': 'road damage',
  'fahrbahnsanierung': 'road resurfacing',
  'fahrbahnerneuerung': 'road resurfacing',
  'fahrbahnausbesserung': 'road surface repairs',
  'fahrbahninstandsetzung': 'road surface repairs',
  'wiederherstellung der fahrbahn': 'road surface restoration',
  'instandsetzungsarbeiten': 'repair works',
  'wartungsarbeiten': 'maintenance work',
  'tunnelwartungsarbeiten': 'tunnel maintenance',
  'betonarbeiten': 'concrete works',
  'kanalarbeiten': 'sewer works',
  'kanalbauarbeiten': 'sewer works',
  'wasserrohrbruch': 'burst water main',
  'rohrbruch': 'burst pipe',
  'wasserleitungsbau': 'water main works',
  'wasserleitungsbauarbeiten': 'water main works',
  'arbeiten an wasserleitungen': 'water main works',
  'arbeiten an gasleitungen': 'gas line works',
  'gasleitungsarbeiten': 'gas line works',
  'arbeiten am gasnetz': 'gas network works',
  'reparatur einer defekten gasleitung': 'repair of a defective gas line',
  'reparatur eines gaslecks als notmaßnahme': 'emergency gas leak repair',
  'arbeiten am fernwärmenetz': 'district heating works',
  'fernwärmearbeiten': 'district heating works',
  'fernwärmeleitungsbauarbeiten': 'district heating pipe works',
  'bruch einer fernwärmeleitung': 'burst district heating pipe',
  'bodensanierung nach ölkabelschaden': 'soil remediation after oil-cable damage',
  'reparaturarbeiten nach einer havarie': 'repairs after a damage incident',
  'sanierung der straßenbahnanlage': 'tram track renovation',
  'grunderneuerung der straßenbahnanlage': 'tram track renewal',
  'neubau radverkehrsanlage': 'new cycle lane construction',
  'neubau geh-und radwege': 'new footpaths and cycle paths',
  'neubau einer mittelinsel': 'new traffic island',
  'neubau straßenüberführung': 'new road overpass',
  'umbau knotenpunkt und modernisierung der lza': 'junction rebuild and traffic light modernisation',
  'kraneinsatz': 'crane operations',
  'kranarbeiten': 'crane operations',
  'wanderbaustelle': 'moving work site',
  'veranstaltung': 'event',
  'demonstration': 'demonstration',
  'fußballspiel': 'football match',
  'fahrbahnverengung': 'carriageway narrowed',
  'fahrbahnverschwenkung': 'lanes shifted',
  'fahrbahnverengung und -verschwenkung': 'carriageway narrowed and shifted',
  'fahrspurreduzierung': 'lane reduction',
  'rechter fahrstreifen gesperrt': 'right lane closed',
  'linker fahrstreifen gesperrt': 'left lane closed',
  'linker fahrstreifen blockiert': 'left lane blocked',
  'linker fahrstreifen je richtung gesperrt': 'left lane closed in each direction',
  'linker fahrstreifen in beiden richtungen gesperrt': 'left lane closed in both directions',
  'einzelne fahrstreifen gesperrt': 'some lanes closed',
  'ein fahrstreifen gesperrt': 'one lane closed',
  '1 fahrstreifen gesperrt': 'one lane closed',
  'sperrung eines fahrstreifens': 'one lane closed',
  'fahrstreifen gesperrt im kreuzungsbereich': 'lane closed at the junction',
  'gesperrt im kreuzungsbereich': 'closed at the junction',
  'nur ein fahrstreifen frei': 'only one lane open',
  'nur ein geradeausfahrstreifen frei': 'only one straight-ahead lane open',
  'fahrtrichtung gesperrt': 'one direction closed',
  'fahrtrichtung für kfz-verkehr gesperrt': 'one direction closed to motor vehicles',
  'fahrtrichtung für den kfz-verkehr gesperrt': 'one direction closed to motor vehicles',
  'fahrtrichtung für kfz- und radverkehr gesperrt': 'one direction closed to motor vehicles and bikes',
  'fahrtrichtung für den kfz- und radverkehr gesperrt': 'one direction closed to motor vehicles and bikes',
  'fahrtrichtung für kfz-verkehr gesperrt (einbahnstraße)': 'one direction closed to motor vehicles (one-way street)',
  'fahrtrichtung für kfz gesperrt (einbahnstraße)': 'one direction closed to motor vehicles (one-way street)',
  'vollsperrung': 'full closure',
  'vollsperrung in beiden richtungen': 'full closure in both directions',
  'vollsperrung für den kfz-verkehr': 'fully closed to motor vehicles',
  'vollsperrung für kfz-verkehr': 'fully closed to motor vehicles',
  'vollsperrung für kfz-verkehr gesperrt': 'fully closed to motor vehicles',
  'für kfz-verkehr voll gesperrt': 'fully closed to motor vehicles',
  'vollsperrung für den kfz- und radverkehr': 'fully closed to motor vehicles and bikes',
  'abschnittsweise vollsperrung für kfz- und radverkehr': 'full closure for motor vehicles and bikes, in sections',
  'vollsperrung der überfahrten zur a100': 'A100 crossings fully closed',
  'einfahrt gesperrt': 'entry closed',
  'ausfahrt gesperrt': 'exit closed',
  'ausfahrt bis auf weiteres gesperrt': 'exit closed until further notice',
  'auffahrt gesperrt': 'on-ramp closed',
  'überfahrt gesperrt': 'crossing closed',
  'ein- und ausfahrt gesperrt': 'entry and exit closed',
  'gehweg gesperrt': 'sidewalk closed',
  'vorübergehende regelung durch provisorische ampelanlagen': 'temporary traffic lights in operation',
  'vorübergehende regelung durch 2 provisorische ampelanlagen': 'two temporary traffic lights in operation',
  'eine baustellenampel regelt den verkehr': 'a temporary traffic light controls traffic',
  'eine baustellenampel regelt wechselseitig den verkehr': 'a temporary traffic light controls alternating traffic',
  'zwei baustellenampeln regeln wechselseitig den verkehr': 'two temporary traffic lights control alternating traffic',
  'der fußverkehr wird über zwei provisorische ampeln geregelt': 'pedestrians are controlled by two temporary traffic lights',
  'ampelanlage außer betrieb': 'traffic lights out of order',
  'ohne ampel': 'no traffic lights',
  'für beide richtungen nur ein fahrstreifen abwechselnd frei': 'one lane open, alternating directions',
  'für beide richtungen abwechselnd ein fahrstreifen frei': 'one lane open, alternating directions',
  'nur ein fahrstreifen für beide richtungen': 'one lane shared by both directions',
  'für beide fahrtrichtungen steht nur ein fahrstreifen zur verfügung': 'one lane shared by both directions',
  'für beide fahrtrichtungen steht nur ein gemeinsamer fahrstreifen zur verfügung': 'one lane shared by both directions',
  'für beiden richtungen nur ein gemeinsamer fahrstreifen frei': 'one lane shared by both directions',
  'für beide richtungen jeweils nur ein fahrstreifen frei': 'only one lane open in each direction',
  'verkehr wird auf die gegenfahrbahn verschwenkt': 'traffic shifted to the opposite carriageway',
  'verschwenkung beider fahrtrichtungen auf die nördliche fahrbahn': 'both directions shifted to the northern carriageway',
  'geänderte verkehrsführung': 'changed traffic layout',
  'geänderte verkehrsführung im baustellenbereich': 'changed traffic layout in the work zone',
  'einbahnstraßenregelung': 'one-way traffic in place',
  'sperrung von abbiegebeziehungen': 'some turns not possible',
  'wegfall von abbiegebeziehungen': 'some turns not possible',
  'abbiegen nach links nicht möglich': 'no left turn',
  'abbiegen nach rechts nicht möglich': 'no right turn',
  'linksabbiegen nicht möglich': 'no left turn',
  'im gesamten kreuzungsbereich kein linksabbiegen möglich': 'no left turns anywhere at the junction',
  'eine umleitung ist eingerichtet': 'a detour is in place',
  'eine umleitung ist ausgeschildert': 'a detour is signposted',
  'umleitungen sind ausgeschildert': 'detours are signposted',
  'umleitungen sind eingerichtet': 'detours are in place',
  'umleitung ausgewiesen': 'detour signposted',
  'für den radverkehr ist eine umleitung ausgeschildert': 'a detour for cyclists is signposted',
  'umleitungen für kfz- und radverkehr sind ausgeschildert': 'detours for vehicles and cyclists are signposted',
  'der fußverkehr wird umgeleitet': 'pedestrians are diverted',
  'der radverkehr wird über die fahrbahn geführt': 'cyclists are routed onto the road',
  'der radverkehr wird über die fahrbahn geführt und darf nicht überholt werden': 'cyclists are routed onto the road and must not be overtaken',
  'der radverkehr wird über den gehweg geführt': 'cyclists are routed onto the sidewalk',
  'der fahrradverkehr wird separat am baufeld vorbeigeführt': 'cyclists are routed separately past the site',
  'radfahrende und zu fuß gehende können die brücke passieren': 'cyclists and pedestrians can cross the bridge',
  'überholen verboten': 'no overtaking',
  'überholverbot': 'no overtaking',
  'überholverbot für schwerlastverkehr': 'no overtaking for heavy goods vehicles',
  'überholverbot des radverkehrs': 'no overtaking of cyclists',
  'staugefahr': 'risk of congestion',
  'stau zu erwarten': 'congestion expected',
  'verkehrsbehinderung zu erwarten': 'delays expected',
  'verkehrseinschränkungen': 'traffic restrictions',
  'zu hohe verkehrsbelastung': 'heavy traffic',
  'ortskundige autofahrer werden gebeten': 'local drivers are asked',
  'das gebiet weiträumig zu umfahren': 'to avoid the area',
  'bitte den kreuzungsbereich umfahren': 'please avoid the junction',
  'bitte vorsichtig fahren': 'please drive carefully',
  'fahren sie bitte besonders vorsichtig': 'please drive with extra care',
  'bitte erhöhte vorsicht!': 'please take extra care!',
  'mit vorsicht passierbar': 'passable with care',
  'auf beschilderung achten': 'follow the signs',
  'vorsicht an der kreuzung': 'caution at the junction',
  'gefahr': 'hazard',
  'gefahrenstelle': 'hazard',
  'gefahr durch gegenstände auf der fahrbahn': 'hazard: objects on the road',
  'gefahr durch liegengebliebenes fahrzeug': 'hazard: broken-down vehicle',
  'gefahr durch liegengebliebenes fahrzeug auf dem standstreifen': 'hazard: broken-down vehicle on the hard shoulder',
  'gefahr durch personen auf der fahrbahn': 'hazard: people on the road',
  'gefahr durch ungesicherte unfallstelle': 'hazard: unsecured accident site',
  'wasser auf der fahrbahn': 'water on the road',
  'unfallstelle geräumt': 'accident cleared',
  'polizei ist benachrichtigt': 'police notified',
  'rettungshubschrauber im einsatz': 'rescue helicopter in operation',
  'spurwechselanlagen defekt': 'lane-change system faulty',
  'fehlende tunnel überwachung': 'tunnel monitoring offline',
  'straße wieder frei': 'road open again',
  'straße wird mehrfach gesperrt': 'road will be closed several times',
  'vollsperrung für den kfz-, rad- und fußverkehr': 'fully closed to vehicles, bikes and pedestrians',
  'zufahrt bis tankstelle frei': 'access to the petrol station open',
  'brücke abgerissen': 'bridge demolished',
  'tunneldeckensanierung u6': 'U6 tunnel ceiling renovation',
  'einrichtung baustellenzufahrt mit gegenverkehrsregelung': 'site access set up, alternating one-lane traffic',
  'prüfung der stützpfeiler der eisenbahnbrücke': 'inspection of the railway bridge piers',
  'leitungsarbeiten in drei bauphasen': 'utility line works in three phases',
  'sanierung eines gleichrichterwerks': 'renovation of a rectifier substation',
  'sanierung der s-bahnbrücke': 'S-Bahn bridge renovation',
};

const NUM = { einen: 'one', ein: 'one', eine: 'one', zwei: 'two', drei: 'three', vier: 'four', 1: 'one', 2: 'two', 3: 'three' };

// "bis Anfang 2027", "bis vsl. Ende 2027", "bis 12/26" → English.
const timeWords = (s) =>
  s
    .replace(/\bvsl\.?\s*/g, 'expected ')
    .replace(/\bAnfang\b/g, 'early')
    .replace(/\bEnde\b/g, 'end of')
    .replace(/\bMitte\b/g, 'mid')
    .replace(/\bFrühjahr\b/g, 'spring')
    .replace(/\bSommer\b/g, 'summer')
    .replace(/\bHerbst\b/g, 'autumn')
    .replace(/\bWinter\b/g, 'winter')
    .replace(/\bJanuar\b/g, 'January').replace(/\bFebruar\b/g, 'February').replace(/\bMärz\b/g, 'March')
    .replace(/\bMai\b/g, 'May').replace(/\bJuni\b/g, 'June').replace(/\bJuli\b/g, 'July')
    .replace(/\bOktober\b/g, 'October').replace(/\bDezember\b/g, 'December');

// Pattern rules for templated sentences containing street names or numbers.
// Each returns an English string or null.
const RULES = [
  // Fahrbahn [jeweils|in beiden Richtungen|…] auf <n> [verschwenkten] Fahrstreifen [je Richtung] verengt [und verschwenkt]
  (s) => {
    const m = s.match(
      /^(?:Fahrbahn|Farbahn|Fahrstreifen|Straße verschwenkt und)(?: (jeweils|in beiden Richtungen|in allen Richtungen|abschnittsweise))? auf (jeweils )?(einen|zwei|drei|vier) (verschwenkten )?Fahrstreifen( je Richtung)? (verengt|gesperrt|reduziert)( und verschwenkt)?$/i,
    );
    if (!m) return null;
    const [, scope, each, n, shifted, perDir, verb, andShifted] = m;
    const num = NUM[n.toLowerCase()];
    const lanes = `${num} ${shifted ? 'shifted ' : ''}lane${num === 'one' ? '' : 's'}`;
    const action = { verengt: 'narrowed to', gesperrt: 'closed down to', reduziert: 'reduced to' }[verb];
    const where = {
      jeweils: ' in each direction',
      'in beiden richtungen': ' in both directions',
      'in allen richtungen': ' in all directions',
      abschnittsweise: ' in sections',
    }[scope?.toLowerCase()] ?? '';
    const s2 = s.startsWith('Straße verschwenkt') ? 'road shifted and ' : 'carriageway ';
    return `${s2}${action} ${lanes}${each || perDir ? ' in each direction' : ''}${where}${andShifted ? ', and shifted' : ''}`;
  },
  (s) => {
    const m = s.match(/^Fahrbahn(?: (jeweils|in beiden Richtungen|abschnittsweise))? (?:auf zwei Fahrstreifen )?verengt und verschwenkt$/i);
    if (!m) return null;
    const where = { jeweils: ' in each direction', 'in beiden richtungen': ' in both directions', abschnittsweise: ' in sections' }[m[1]?.toLowerCase()] ?? '';
    return `carriageway narrowed and shifted${where}`;
  },
  // Richtung X <phrase>
  (s) => {
    const m = s.match(/^Richtung (\S+(?: \S+)?) (Fahrbahn .+)$/);
    if (!m) return null;
    const rest = translatePhrase(m[2]);
    return rest ? `towards ${m[1]}: ${rest}` : null;
  },
  // Die X [und Y] ist/sind [für den Kfz-Verkehr] [auf der Seite Richtung Z] von der Y abgehängt (Sackgasse)
  (s) => {
    const m = s.match(
      /^(?:(?:Die|Der|Das) )?(.+?) (?:ist|sind)(?: für den (?:Kfz-|Kfz- und Rad)verkehr)?(?: auf der Seite Richtung (.+?))? (?:vom|von der|von den|von) (.+?)(?: für den (?:Kfz-|Kfz- und Rad)verkehr)? abgehängt(?: \(Sackgassen?\))?$/,
    );
    if (!m) return null;
    const names = m[1].replace(/ und (?:die |der )?/g, ' and ');
    return `${names} cut off from ${m[3]}${m[2] ? ` on the side towards ${m[2]}` : ''} (dead end)`;
  },
  // [Das] [Links|Rechts]abbiegen [von der X] in/auf die Y [Richtung Z] ist nicht möglich
  (s) => {
    const m = s.match(
      /^(?:([Ss]tadteinwärts|[Ss]tadtauswärts|In Richtung \S+)(?: ist)? )?(?:das |Das )?(Links|Rechts|links|rechts)?[Aa]bbiegen (?:von (?:der |dem )?(.+?) (?:\((?:Richtung )?(.+?)\) )?)?(?:in|auf) (?:(?:die|den|das) )?(.+?)(?: Richtung (.+?))?(?: (?:ist )?(?:in Fahrtrichtung (.+?) )?(?:nicht möglich|gesperrt))$/,
    );
    if (!m) return null;
    const [, pre, dir, from, , into, towards, inDir] = m;
    const turn = dir ? `${/^l/i.test(dir) ? 'left' : 'right'} turn` : 'turn';
    const prefix = pre
      ? `${pre.replace(/^[Ss]tadteinwärts/, 'inbound').replace(/^[Ss]tadtauswärts/, 'outbound').replace('In Richtung', 'towards')}: `
      : '';
    return `${prefix}no ${turn}${from ? ` from ${from}` : ''} into ${into}${towards ? ` towards ${towards}` : ''}${inDir ? ` (direction ${inDir})` : ''}`;
  },
  // [Die] Einfahrt von der X in den Y ist nicht möglich
  (s) => {
    const m = s.match(/^(?:Die |die )?Einfahrt von (?:der |dem )?(.+?) (?:in|auf) (?:die|den|das) (.+?) ist nicht möglich( \(jeweils Einbahnstraßenregelung\))?$/);
    return m ? `no entry from ${m[1]} into ${m[2]}${m[3] ? ' (one-way streets)' : ''}` : null;
  },
  (s) => {
    const m = s.match(/^Die Durchfahrt von (?:der )?(.+?) zur (.+?) ist gesperrt$/);
    return m ? `no through traffic from ${m[1]} to ${m[2]}` : null;
  },
  // Anbindung X [zeitweise] gesperrt
  (s) => {
    const m = s.match(/^Anbindung (.+?)(?: z[w]?eitweise)? gesperrt$/);
    return m ? `access to ${m[1].replace(/ und /g, ' and ')} closed` : null;
  },
  // Ausfahrt/Auffahrt/Überfahrt X [Richtung Y] gesperrt
  (s) => {
    const m = s.match(/^(Ausfahrt|Auffahrt|Einfahrt|Überfahrt|Zufahrt) (?:von\/zur )?(.+?)(?: Richtung (.+?))? gesperrt$/);
    if (!m) return null;
    const what = { Ausfahrt: 'exit', Auffahrt: 'on-ramp', Einfahrt: 'entry', Überfahrt: 'crossing', Zufahrt: 'access' }[m[1]];
    return `${what} ${m[2]}${m[3] ? ` towards ${m[3]}` : ''} closed`;
  },
  (s) => {
    const m = s.match(/^(?:Briesingstraße|.+straße|.+damm|.+allee) Richtung (.+) gesperrt$/);
    return m ? `${s.split(' Richtung ')[0]} closed towards ${m[1]}` : null;
  },
  (s) => {
    const m = s.match(/^Der Verkehr wird über (.+) geführt$/);
    return m ? `traffic is routed via ${m[1]}` : null;
  },
  (s) => {
    const m = s.match(/^Radverkehr wird über (.+) umgeleitet$/);
    return m ? `cyclists are diverted via ${m[1].replace(/ und /g, ' and ')}` : null;
  },
  (s) => {
    const m = s.match(/^Bitte (?:die )?(?:Einfahrt|Zufahrt) (.+) nutzen$/);
    return m ? `please use the ${m[1]} entrance` : null;
  },
  // Im Anschluss folgen/finden weitere Arbeiten/Bauphasen [statt] [(bis X) | bis X]
  (s) => {
    const m = s.match(/^[Ii]m Anschluss (?:folgen|finden) weitere (Arbeiten|Bauphasen)(?: statt)?(?: \(bis (.+)\)| bis (.+))?$/);
    if (!m) return null;
    const until = m[2] || m[3];
    return `further ${m[1] === 'Bauphasen' ? 'construction phases' : 'works'} will follow${until ? ` (until ${timeWords(until)})` : ''}`;
  },
  (s) => {
    const m = s.match(/^Gesamt(?:bau)?maßnahme bis (.+)$/);
    return m ? `whole project until ${timeWords(m[1])}` : null;
  },
  (s) => {
    const m = s.match(/^(?:Höchstgeschwindigkeit von|Geschwindigkeit auf) (\d+) [Kk]m\/h(?: reduziert)?$/);
    return m ? `speed limit ${m[1]} km/h` : null;
  },
  // Weight / height / width limits ("2,8 t" → "2.8 t")
  (s) => {
    const m = s.match(
      /^(vorübergehende )?(Beschränkung des zulässigen Gesamtgewichts|Gewichtsbeschränkung|Beschränkung der Höhe|Begrenzung der Fahrbahnbreite) auf ([\d,]+ ?(?:t|m))$/,
    );
    if (!m) return null;
    const what = /Höhe/.test(m[2]) ? 'height' : /breite/.test(m[2]) ? 'width' : 'weight';
    return `${m[1] ? 'temporary ' : ''}${what} limit ${m[3].replace(',', '.')}`;
  },
  (s) => {
    const m = s.match(/^gesperrt für LKW über ([\d,]+ ?t)$/);
    return m ? `closed to trucks over ${m[1].replace(',', '.')}` : null;
  },
  (s) => {
    const m = s.match(/^alle Auf- und Abfahrten in Richtung (.+) gesperrt$/);
    return m ? `all ramps towards ${m[1]} closed` : null;
  },
  (s) => {
    const m = s.match(/^Arbeiten im Zusammenhang mit dem Umbau (.+)$/);
    return m ? `works related to the rebuild of ${m[1]}` : null;
  },
  (s) => {
    const m = s.match(/^Staugefahr aufgrund der Einschränkungen im Bereich der (.+)$/);
    return m ? `risk of congestion due to restrictions around ${m[1]}` : null;
  },
  (s) => {
    const m = s.match(/^Umleitungsstrecke für gesperrte (.+)$/);
    return m ? `detour route for the closed ${m[1]}` : null;
  },
  (s) => {
    const m = s.match(/^(.+?) nicht betroffen$/);
    return m && !/\s(der|die|das)\s/.test(m[1]) ? `${m[1]} not affected` : null;
  },
  // Neubau / Instandsetzung / Sanierung <Name>
  (s) => {
    const m = s.match(/^(Neubau|Instandsetzung|Sanierung|Grundsanierung|Umbau|Rückbau)(?: der| des)? ([A-ZÄÖÜ0-9][^\s]*(?: [A-ZÄÖÜ0-9][^\s]*)*)$/);
    if (!m) return null;
    const what = { Neubau: 'new construction', Instandsetzung: 'repairs', Sanierung: 'renovation', Grundsanierung: 'full renovation', Umbau: 'rebuild', Rückbau: 'demolition' }[m[1]];
    return `${what}: ${m[2]}`;
  },
];

function translatePhrase(fragment) {
  const raw = fragment.trim().replace(/#$/, '');
  if (!raw) return '';
  const exact = PHRASES[raw.toLowerCase()];
  if (exact) return exact;
  // Strip a trailing "(bis …)" / "(Gesamt(bau)maßnahme bis …)" note and retry.
  const note = raw.match(/^(.*?)\s*\((?:Gesamt(?:bau)?maßnahme|Ges+amtarbeiten)? ?bis (.+)\)$/);
  if (note) {
    const main = translatePhrase(note[1]);
    return main ? `${main} (until ${timeWords(note[2])})` : null;
  }
  for (const rule of RULES) {
    const out = rule(raw);
    if (out) return out;
  }
  return null;
}

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// Translates a free-text description. Returns null if any part is not covered,
// so callers can fall back to the original German.
export function translateText(text) {
  if (!text) return text;
  // Split into sentence/clause fragments, keeping the separators. Don't split
  // decimal numbers like "2,8 t" or lists like "Kfz-, Rad- und Fußverkehr".
  const parts = text.split(/((?<![\d-])[,.;](?!\d)\s*)/);
  const out = [];
  let sentenceStart = true;
  for (let i = 0; i < parts.length; i += 2) {
    const frag = parts[i];
    const sep = parts[i + 1] ?? '';
    if (frag.trim()) {
      const en = translatePhrase(frag);
      if (en == null) return null;
      out.push(sentenceStart ? capitalize(en) : en);
    }
    out.push(sep);
    sentenceStart = /[.;]/.test(sep);
  }
  return out.join('').trim();
}

// Location strings ("in beiden Richtungen zwischen A und B", "in Höhe X"):
// translate only the connecting words; street names stay as they are.
// Unicode-aware word boundaries (\b treats ä/ö/ü/ß as non-word characters).
const word = (w, flags = '') => new RegExp(`(?<!\\p{L})${w}(?!\\p{L})`, `gu${flags}`);
const LOCATION_RULES = [
  [word('in beiden Richtungen'), 'in both directions'],
  [word('beide Richtungen'), 'both directions'],
  [word('in Fahrtrichtung'), 'heading towards'],
  [word('in Richtung'), 'towards'],
  [word('Richtung'), 'towards'],
  [word('zwischen'), 'between'],
  [word('in Höhe'), 'at'],
  [word('Höhe'), 'at'],
  [word('im Kreuzungsbereich'), 'at the junction'],
  [word('Kreuzungsbereich'), 'junction'],
  [word('Kreuzung'), 'junction'],
  [word('stadteinwärts', 'i'), 'inbound'],
  [word('stadtauswärts', 'i'), 'outbound'],
  [word('sowie'), 'and'],
  [word('und'), 'and'],
  [word('ab'), 'from'],
  [word('bis'), 'to'],
  [word('vor'), 'before'],
  [word('hinter'), 'past'],
  [word('bei'), 'near'],
  [word('(?:an der|an dem|am)'), 'at'],
  [word('Ecke'), 'corner of'],
  [/(?<!\p{L})Nr\./gu, 'No.'],
  [word('Bereich'), 'area'],
  [word('beidseitig', 'i'), 'both sides'],
];
const LEFTOVER_GERMAN =
  /(?<!\p{L})(der|die|das|den|dem|des|ist|sind|von|vom|zur|zum|nicht|und|für|mit|wird|im|ein|eine|einen|nach|über|auf|gesperrt|verengt|frei)(?!\p{L})/iu;

// Proper names that contain German function words and must not be translated:
// "Manfred-von-Richthofen-Straße", "Unter den Linden", "Platz der Luftbrücke",
// "An der Wuhlheide", "Am Treptower Park", "Straße der Pariser Kommune".
const CAP = '[A-ZÄÖÜ][\\p{L}.]*';
const STREET_NAMES = new RegExp(
  [
    '(?:Straße|Platz) des \\d+\\. \\p{L}+',
    '[\\p{L}.]+(?:-[\\p{L}.]+)*-(?:von|vom|der|den|des|am|an|zum|zur|und)-[\\p{L}.-]+',
    `(?:${CAP}) (?:der|den|des|dem|am|zum|zur) ${CAP}(?: ${CAP})*`,
    `(?<![\\p{L}])(?:Am|An der|An den|Im|In den|Zum|Zur|Alt) ${CAP}(?: ${CAP})*`,
  ].join('|'),
  'gu',
);

const EXTRA_LOCATION_RULES = [
  [word('im Einmündungsbereich'), 'at the junction'],
  [word('vor (?:der|dem)'), 'before'],
  [word('hinter (?:der|dem)'), 'past'],
  [word('Einmündungsbereich'), 'junction'],
  [word('im Bereich'), 'around'],
  [word('in der Ausfahrt'), 'at the exit'],
  [word('Auffahrt auf die'), 'on-ramp to the'],
  [word('Überfahrt auf die'), 'crossing onto the'],
  [word('Einfahrt auf die'), 'entry onto the'],
  [word('Ein- und Ausfahrt'), 'entry and exit'],
  [word('Ausfahrt'), 'exit'],
  [word('Auffahrt'), 'on-ramp'],
  [word('Einfahrt'), 'entry'],
  [word('im Kreuz'), 'at interchange'],
  [word('Ri\\.'), 'towards'],
  [word('von'), 'from'],
  [word('über'), 'over'],
];

export function translateLocation(text) {
  if (!text) return text;
  const names = [];
  let s = text.replace(STREET_NAMES, (m) => `\u0000${names.push(m) - 1}\u0000`);
  for (const [re, en] of [...EXTRA_LOCATION_RULES, ...LOCATION_RULES]) s = s.replace(re, en);
  if (LEFTOVER_GERMAN.test(s)) return null;
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => names[i]);
}

export function translateTerm(term) {
  return term ? TERMS[term] ?? null : term;
}
