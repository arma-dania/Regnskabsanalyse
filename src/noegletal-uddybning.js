/*
  Uddybende forklaringer til fanen Nøgletal – én pr. nøgletal, nøglet på id.

  Formlerne og de korte definitioner står i NOEGLETAL i App.jsx og følger
  lærebogens Bilag 2. Her står det, der skal hjælpe den studerende med at
  FORSTÅ tallet: hvad det måler i almindelige ord, hvad et højt og et lavt tal
  betyder, hvorfor nogen interesserer sig for det, og hvor man typisk tager fejl.

  Eksemplerne bruger runde, opdigtede tal og aldrig tal fra opgavens cases.

  Felter:
    kortSagt      én sætning, der siger det med almindelige ord
    eksempel      et lille regneeksempel med opdigtede tal
    forklaring    hvad tallet måler, og hvorfor det er bygget sådan
    hoej / lav    hvad et højt og et lavt tal typisk betyder
    vigtigt       hvem der kigger på det, og hvad de bruger det til
    model         hvordan niveauet afhænger af forretningsmodellen (valgfri)
    faldgrube     den fejl, studerende oftest laver
    relateret     id'er på nøgletal, det hænger sammen med
*/

export const UDDYBNING = {
  /* ---------------- Rentabilitet ---------------- */
  ag: {
    kortSagt: "Hvor mange kroner driften tjener for hver 100 kr., der er bundet i virksomheden.",
    eksempel: "Aktiver for 10 mio. kr. og et resultat af primær drift på 1 mio. kr. giver en afkastningsgrad på 10 %.",
    forklaring:
      "Afkastningsgraden måler, hvor godt virksomheden forrenter ALLE sine aktiver – uanset om de er betalt af ejerne eller lånt. Derfor bruges resultatet af primær drift, altså før renter: finansieringen skal ikke blande sig i, hvor god selve driften er. Det gør afkastningsgraden til det bedste mål for, om forretningen i sig selv er rentabel.",
    hoej: "Driften tjener godt på den kapital, den bruger – enten fordi der tjenes meget pr. omsætningskrone, eller fordi kapitalen omsættes mange gange.",
    lav: "Kapitalen giver et lavt afkast. Enten er indtjeningen pr. salg lav, eller der er bundet meget kapital i forhold til aktiviteten.",
    vigtigt:
      "Det er det første tal, man ser på i en rentabilitetsanalyse. Hold det op mod lånerenten (fremmedkapitalens forrentning): kun når afkastningsgraden er højere, kan det betale sig at låne. Og hold det op mod det afkast, kapitalen kunne have fået andre steder.",
    model:
      "To veje til samme afkastningsgrad: en avanceforretning tjener meget pr. salg men omsætter kapitalen langsomt; en volumenforretning tjener lidt pr. salg men omsætter kapitalen hurtigt.",
    faldgrube:
      "At forklare en ændring i afkastningsgraden uden at dekomponere den. Brug AG = OG × AOH og find ud af, hvilken af de to faktorer der har flyttet sig.",
    relateret: ["og", "aoh", "ekf", "fkf"],
  },
  og: {
    kortSagt: "Hvor mange kroner der er tilbage af hver 100 kr. i omsætning, når driften er betalt.",
    eksempel: "Omsætning 20 mio. kr. og resultat af primær drift 1,5 mio. kr. giver en overskudsgrad på 7,5 %.",
    forklaring:
      "Overskudsgraden viser forholdet mellem indtægter og omkostninger i den daglige drift – før renter og skat. Den svarer på: Når kunden betaler 100 kr., hvor meget bliver så til overskud? Den påvirkes både af prisen (og dermed bruttomarginen) og af, hvor tunge kapacitetsomkostningerne er.",
    hoej: "Virksomheden kan tage gode priser, køber godt ind eller har styr på omkostningerne.",
    lav: "Priserne er pressede, vareforbruget er højt, eller kapacitetsomkostningerne æder bruttoresultatet.",
    vigtigt:
      "Overskudsgraden er den ene halvdel af afkastningsgraden. Et fald er ofte det første tegn på pres fra konkurrenter eller stigende omkostninger. Hvorfor den bevæger sig, finder du under indtjeningsevne.",
    model:
      "En lav overskudsgrad er ikke nødvendigvis dårlig: i dagligvarehandel er få procent normalt, fordi kapitalen omsættes hurtigt. I software eller rådgivning forventes den at være høj.",
    faldgrube:
      "At sammenligne overskudsgraden på tværs af brancher uden at tænke på forretningsmodellen – og at glemme, at den skal ses sammen med aktivernes omsætningshastighed.",
    relateret: ["ag", "aoh", "bruttomargin", "kapacitetsgrad"],
  },
  aoh: {
    kortSagt: "Hvor mange kroner omsætning hver krone i aktiver skaber på et år.",
    eksempel: "Omsætning 30 mio. kr. og gennemsnitlige aktiver 15 mio. kr. giver en omsætningshastighed på 2,0.",
    forklaring:
      "Aktivernes omsætningshastighed måler, hvor effektivt kapitalen bliver brugt. Et tal på 2,0 betyder, at virksomheden omsætter for to kroner for hver krone, der er bundet i bygninger, maskiner, lager, tilgodehavender og likvider. Jo mindre kapital der skal til for at skabe salget, jo højere tal.",
    hoej: "Virksomheden klarer sig med lidt kapital i forhold til aktiviteten – et 'let' forretningsgrundlag.",
    lav: "Der er bundet meget kapital i forhold til salget: store anlæg, stort lager, lang kredit til kunderne – eller ubrugte likvider.",
    vigtigt:
      "Omsætningshastigheden er den anden halvdel af afkastningsgraden. Kan virksomheden frigøre kapital uden at miste salg, stiger afkastningsgraden – uden at der tjenes en krone mere pr. salg.",
    model:
      "Kapitaltunge virksomheder (produktion, hoteller, energi) ligger typisk under 1. Handel og webshops kan ligge på 2–4 eller mere.",
    faldgrube:
      "At overse, at store likvide beholdninger trækker omsætningshastigheden ned. Hvor kapitalen er bundet, undersøger du under kapitaltilpasning.",
    relateret: ["ag", "og", "anlaeg-oh", "lager-oh", "debitor-oh"],
  },
  ekf: {
    kortSagt: "Hvor mange kroner ejerne tjener for hver 100 kr., de har i virksomheden.",
    eksempel: "Gennemsnitlig egenkapital 8 mio. kr. og årets resultat 1,2 mio. kr. giver en egenkapitalforrentning på 15 %.",
    forklaring:
      "Egenkapitalens forrentning er ejernes afkast – efter renter og skat. Den afhænger af to ting: hvor god driften er (afkastningsgraden) og hvordan virksomheden er finansieret (gearingen). Er afkastningsgraden højere end lånerenten, løfter lån ejernes afkast; er den lavere, trækker lånene ned.",
    hoej: "Ejerne får et godt afkast – men se efter, om det skyldes en stærk drift eller en høj gearing. Det sidste giver mere risiko.",
    lav: "Ejerne får et lavt afkast i forhold til den risiko, de bærer.",
    vigtigt:
      "Det er det tal, ejere og investorer interesserer sig mest for. Hold det op mod ejernes afkastkrav: en risikofri rente plus et tillæg for, at det er en risikabel investering.",
    model: null,
    faldgrube:
      "At forklare en stigning i egenkapitalens forrentning uden at se på gearingen. Brug sammenhængen (før skat): EKF = AG + (AG − FKF) × gearing.",
    relateret: ["ag", "fkf", "gearing", "soliditetsgrad"],
  },
  fkf: {
    kortSagt: "Den gennemsnitlige rente, virksomheden betaler på sin gæld.",
    eksempel: "Gennemsnitlig fremmedkapital 10 mio. kr. og nettorenteomkostninger 0,4 mio. kr. giver 4 %.",
    forklaring:
      "Fremmedkapitalens forrentning viser, hvad det koster virksomheden at låne. Den bruges især som målestok for afkastningsgraden: det er kun en fordel for ejerne at låne, hvis pengene i driften forrentes bedre, end de koster.",
    hoej: "Lånene er dyre – måske fordi långiverne ser en høj risiko, eller fordi renteniveauet er steget.",
    lav: "Billig finansiering – eller en stor del af gælden er rentefri.",
    vigtigt:
      "Forskellen mellem afkastningsgraden og fremmedkapitalens forrentning (rentemarginalen) afgør, om gearingen virker for eller imod ejerne.",
    model: null,
    faldgrube:
      "Fremmedkapital omfatter også rentefri gæld som leverandørgæld og skyldig moms og skat. Derfor er tallet lavere end den rente, virksomheden faktisk betaler på sine lån. Det er et gennemsnit, ikke bankens rente.",
    relateret: ["ag", "ekf", "gearing"],
  },
  gearing: {
    kortSagt: "Hvor mange kroner gæld der er for hver krone, ejerne har skudt ind.",
    eksempel: "Fremmedkapital 6 mio. kr. og egenkapital 4 mio. kr. giver en gearing på 1,5.",
    forklaring:
      "Den finansielle gearing viser, hvor meget virksomheden er finansieret med lånte penge i forhold til ejernes egne. Gearing virker som et håndtag: når afkastningsgraden er højere end lånerenten, løfter hver lånt krone ejernes afkast. Men håndtaget virker begge veje – går driften dårligt, forstærkes tabet.",
    hoej: "Meget lånt kapital: ejernes afkast svinger mere, og virksomheden er mere sårbar over for fald i indtjeningen og stigende renter.",
    lav: "Lidt gæld: robust, men ejerne får ikke det løft, gearing kan give, når driften går godt.",
    vigtigt:
      "Gearingen forklarer, hvorfor egenkapitalens forrentning kan afvige meget fra afkastningsgraden – og den er et mål for finansiel risiko.",
    model: null,
    faldgrube:
      "At tro, at høj gearing altid er godt, fordi den løfter egenkapitalens forrentning. Den gør det kun, så længe afkastningsgraden er højere end lånerenten.",
    relateret: ["ekf", "fkf", "soliditetsgrad"],
  },

  /* ---------------- Indtjeningsevne ---------------- */
  bruttomargin: {
    kortSagt: "Hvor mange kroner der er tilbage af hver 100 kr. i salg, når varerne er betalt.",
    eksempel: "Omsætning 10 mio. kr. og vareforbrug 6 mio. kr. giver et bruttoresultat på 4 mio. kr. – en bruttomargin på 40 %.",
    forklaring:
      "Bruttomarginen viser forskellen mellem salgspris og indkøbspris (eller produktionspris) i procent af omsætningen. Det, der er tilbage, skal dække alle de øvrige omkostninger – løn, husleje, markedsføring, afskrivninger – og så give overskud.",
    hoej: "Kunderne betaler for noget ekstra: et stærkt brand, et unikt produkt eller service. Eller indkøbet er godt.",
    lav: "Hård priskonkurrence, dyrt indkøb eller et produktmix med billige varer.",
    vigtigt:
      "Bruttomarginen er det første sted, prispres eller stigende råvarepriser viser sig. Den fortæller også noget om, hvor stærkt produktet står hos kunderne.",
    model:
      "Et af de mest afslørende nøgletal for forretningsmodellen: handel med standardvarer har lav bruttomargin, software og mærkevarer høj.",
    faldgrube:
      "At forveksle bruttomargin med avance beregnet på indkøbsprisen. Lægger man 25 % på indkøbsprisen, er bruttomarginen kun 20 %, fordi den regnes af salgsprisen.",
    relateret: ["og", "nulpunkt", "kapacitetsgrad"],
  },
  indekstal: {
    kortSagt: "Hvor meget et tal har udviklet sig i forhold til et basisår, der sættes til 100.",
    eksempel: "Omsætning 8 mio. kr. i basisåret og 10 mio. kr. i år giver indeks 125 – en vækst på 25 %.",
    forklaring:
      "Indekstal gør forskellige størrelser sammenlignelige ved at sætte dem alle til 100 i samme basisår. Så kan man se, om omkostningerne vokser hurtigere end omsætningen, eller om resultatet følger med salget.",
    hoej: "Over 100: tallet er vokset siden basisåret.",
    lav: "Under 100: tallet er faldet siden basisåret.",
    vigtigt:
      "Det stærke ved indekstal er sammenligningen: vokser omsætningen med 10 % og resultatet med 30 %, har virksomheden fået mere ud af hver krone i salg. Vokser omkostningerne hurtigere end omsætningen, er det et advarselstegn.",
    model: null,
    faldgrube:
      "At forveksle indeks-point med procentpoint, eller at glemme inflation: en omsætning, der vokser 3 %, mens priserne stiger 5 %, er et fald i mængde.",
    relateret: ["og", "bruttomargin"],
  },
  driftsgearing: {
    kortSagt: "Hvor stor en del af driftsomkostningerne der er faste – dem, der ikke følger salget.",
    eksempel: "Kapacitetsomkostninger 3 mio. kr. og samlede driftsomkostninger 12 mio. kr. giver en driftsmæssig gearing på 25 %.",
    forklaring:
      "Driftsomkostningerne består af variable omkostninger (vareforbrug, der følger salget) og kapacitetsomkostninger (løn, husleje, afskrivninger, der ligger fast på kort sigt). Den driftsmæssige gearing viser, hvor stor andel der er faste. Jo større andel, jo mere svinger resultatet, når omsætningen går op eller ned.",
    hoej: "Mange faste omkostninger: et stigende salg giver et stort løft i resultatet – men et faldende salg rammer hårdt.",
    lav: "Omkostningerne følger salget: resultatet er mere stabilt, men vokser heller ikke så meget ved øget salg.",
    vigtigt:
      "Den driftsmæssige gearing fortæller om risikoen i driften – ligesom den finansielle gearing fortæller om risikoen i finansieringen. Tilsammen viser de, hvor sårbar virksomheden er.",
    model:
      "Producenter med dyre anlæg og softwarevirksomheder har mange faste omkostninger. Handel har mest variable.",
    faldgrube: "At blande driftsmæssig og finansiel gearing sammen. Den ene handler om omkostningerne, den anden om gælden.",
    relateret: ["kapacitetsgrad", "nulpunkt", "sikkerhedsmargin", "gearing"],
  },
  kapacitetsgrad: {
    kortSagt: "Hvor mange gange bruttoresultatet kan betale de faste omkostninger.",
    eksempel: "Bruttoresultat 5 mio. kr. og kapacitetsomkostninger 4 mio. kr. giver en kapacitetsgrad på 1,25.",
    forklaring:
      "Kapacitetsgraden viser, om bruttoresultatet kan dække kapacitetsomkostningerne – og med hvor meget. Er den over 1, er der overskud i den primære drift; på 1,25 er der 25 % mere bruttoresultat, end der skal til.",
    hoej: "God overdækning: der er luft, før de faste omkostninger ikke længere kan betales.",
    lav: "Under 1 giver underskud i driften. Tæt på 1 er virksomheden sårbar.",
    vigtigt: "Kapacitetsgraden er en direkte vej til robustheden: sikkerhedsmarginen kan regnes ud fra den som 1 − 1/kapacitetsgrad.",
    model: null,
    faldgrube: "At tolke den som en procent. En kapacitetsgrad på 1,25 betyder ikke 1,25 %, men at bruttoresultatet er 1,25 gange de faste omkostninger.",
    relateret: ["sikkerhedsmargin", "nulpunkt", "driftsgearing"],
  },
  nulpunkt: {
    kortSagt: "Den omsætning, virksomheden skal nå for at gå i nul i den primære drift.",
    eksempel: "Kapacitetsomkostninger 4 mio. kr. og en bruttomargin på 40 % giver en nulpunktsomsætning på 10 mio. kr.",
    forklaring:
      "Hver krone i salg giver et bidrag på bruttomarginen. Nulpunktsomsætningen er det salg, hvor de samlede bidrag netop betaler kapacitetsomkostningerne. Under nulpunktet giver driften underskud, over nulpunktet giver den overskud.",
    hoej: "Der skal sælges meget, før der tjenes penge – fx fordi de faste omkostninger er steget eller marginen er faldet.",
    lav: "Virksomheden tjener penge allerede ved et lavt salg.",
    vigtigt:
      "Nulpunktet fortæller, hvor meget der skal sælges bare for at overleve. Stiger det hurtigere end omsætningen, bliver virksomheden mere sårbar.",
    model: null,
    faldgrube:
      "At glemme forudsætningerne: beregningen antager, at bruttomarginen er den samme ved alle salgsniveauer, og at kapacitetsomkostningerne ligger helt fast. Det er en forenkling.",
    relateret: ["sikkerhedsmargin", "bruttomargin", "kapacitetsgrad"],
  },
  sikkerhedsmargin: {
    kortSagt: "Hvor mange procent salget kan falde, før driften giver underskud.",
    eksempel: "Omsætning 12,5 mio. kr. og nulpunktsomsætning 10 mio. kr. giver en sikkerhedsmargin på 20 %.",
    forklaring:
      "Sikkerhedsmarginen er afstanden mellem det faktiske salg og nulpunktet, målt i procent af salget. Den er et enkelt mål for, hvor meget modvind virksomheden kan tåle.",
    hoej: "Robust: salget kan falde en del, før der opstår underskud.",
    lav: "Sårbar: selv et mindre fald i salget kan give underskud i driften.",
    vigtigt: "For en långiver eller ejer er sikkerhedsmarginen et af de mest direkte svar på spørgsmålet: Hvad sker der, hvis det går dårligt?",
    model: null,
    faldgrube: "At læse den isoleret. Et stabilt marked med faste kunder kan leve med en lavere sikkerhedsmargin end et marked med store udsving.",
    relateret: ["nulpunkt", "kapacitetsgrad", "driftsgearing"],
  },

  /* ---------------- Kapitaltilpasning ---------------- */
  "anlaeg-oh": {
    kortSagt: "Hvor mange kroner omsætning hver krone i anlægsaktiver skaber.",
    eksempel: "Omsætning 20 mio. kr. og anlægsaktiver 5 mio. kr. giver en omsætningshastighed på 4,0.",
    forklaring:
      "Anlægsaktiverne er de langvarige investeringer: bygninger, maskiner, inventar, software og goodwill. Nøgletallet viser, hvor godt de bliver udnyttet til at skabe salg.",
    hoej: "Anlæggene udnyttes godt – eller virksomheden har få af dem.",
    lav: "Mange anlæg i forhold til aktiviteten: overkapacitet, nye investeringer, der endnu ikke giver salg, eller en kapitaltung branche.",
    vigtigt: "Det er et af de tal, der forklarer aktivernes samlede omsætningshastighed – og dermed afkastningsgraden.",
    model: "Producenter og hoteller har mange anlæg og en lav omsætningshastighed. Konsulenthuse og webshops har få.",
    faldgrube:
      "At glemme, at der bruges ultimo-tal: en stor investering sidst på året trækker tallet ned, selvom anlægget endnu ikke har kunnet skabe salg. Lejede aktiver står ofte slet ikke i balancen.",
    relateret: ["immat-oh", "mat-oh", "aoh", "anlaegsgrad"],
  },
  "immat-oh": {
    kortSagt: "Hvor mange kroner omsætning hver krone i immaterielle aktiver skaber.",
    eksempel: "Omsætning 20 mio. kr. og immaterielle aktiver 1 mio. kr. giver 20.",
    forklaring:
      "Immaterielle anlægsaktiver er værdier, man ikke kan røre: goodwill fra opkøb, software, udviklingsprojekter, patenter og rettigheder. Nøgletallet viser, hvor meget salg de bidrager til.",
    hoej: "Få immaterielle aktiver i forhold til salget.",
    lav: "Mange immaterielle aktiver – fx efter et opkøb (goodwill) eller store investeringer i udvikling.",
    vigtigt: "Et fald kan vise, at virksomheden investerer i fremtiden – eller at den har betalt meget for et opkøb, der endnu ikke giver salg.",
    model: null,
    faldgrube:
      "Når de immaterielle aktiver er små, svinger tallet voldsomt: en lille investering kan halvere det. Se på beløbene bag, før du drager konklusioner.",
    relateret: ["anlaeg-oh", "mat-oh"],
  },
  "mat-oh": {
    kortSagt: "Hvor mange kroner omsætning hver krone i bygninger, maskiner og inventar skaber.",
    eksempel: "Omsætning 20 mio. kr. og materielle aktiver 4 mio. kr. giver 5,0.",
    forklaring:
      "De materielle anlægsaktiver er de fysiske: grunde og bygninger, produktionsanlæg, maskiner, biler og inventar. Nøgletallet viser, hvor godt de bliver udnyttet.",
    hoej: "Det fysiske apparat udnyttes godt – eller der er ikke brug for meget af det.",
    lav: "Overkapacitet, nye investeringer eller en forretning, der kræver tunge anlæg.",
    vigtigt: "For produktionsvirksomheder er det ofte her, kapitalen er bundet – og her et fald i salget gør mest ondt.",
    model: "Afslører, om forretningen er kapitaltung (egen fabrik, egne butikker) eller let (outsourcet produktion, lejede lokaler).",
    faldgrube: "At glemme, at afskrivninger gør aktiverne mindre år for år. En stigning kan skyldes, at anlæggene bliver gamle – ikke at de udnyttes bedre.",
    relateret: ["anlaeg-oh", "immat-oh", "anlaegsgrad"],
  },
  "lager-oh": {
    kortSagt: "Hvor mange gange om året varelageret bliver solgt og fyldt op igen.",
    eksempel: "Vareforbrug 12 mio. kr. og varelager 2 mio. kr. giver 6 gange om året – varerne ligger i gennemsnit ca. 61 dage (365 / 6).",
    forklaring:
      "Et lager binder penge: varerne er betalt, men endnu ikke solgt. Omsætningshastigheden viser, hvor hurtigt de kommer ud af døren. Del 365 med tallet, så får du lagerdage – det antal dage en vare i gennemsnit ligger på lager.",
    hoej: "Varerne sælges hurtigt, og der bindes lidt kapital. Meget høj kan betyde risiko for udsolgt.",
    lav: "Varerne ligger længe: bundet kapital, risiko for ukurante varer og nedskrivninger.",
    vigtigt:
      "Et langsommere lager binder penge, som ellers kunne have været i banken. Det trækker både pengestrømmen og likviditeten ned.",
    model: "Dagligvarer omsættes mange gange om året; møbler, maskiner og mode langt færre. En servicevirksomhed har måske slet intet lager.",
    faldgrube:
      "At bruge omsætningen i tælleren i stedet for vareforbruget. Lageret står til indkøbspris, så det skal sammenlignes med vareforbruget, der også er til indkøbspris.",
    relateret: ["debitor-oh", "kreditor-oh", "pengestrom", "likv2"],
  },
  "debitor-oh": {
    kortSagt: "Hvor mange gange om året kunderne betaler deres regninger.",
    eksempel: "Omsætning 18 mio. kr. og varedebitorer 1,5 mio. kr. giver 12 gange om året – kunderne betaler i gennemsnit efter ca. 30 dage (365 / 12).",
    forklaring:
      "Når kunderne køber på kredit, låner virksomheden i praksis penge ud til dem. Nøgletallet viser, hvor hurtigt pengene kommer hjem. Del 365 med tallet, så får du kundernes gennemsnitlige kredittid i dage.",
    hoej: "Kunderne betaler hurtigt – eller de fleste betaler kontant.",
    lav: "Lang kredittid: penge bundet hos kunderne og risiko for tab, hvis de ikke betaler.",
    vigtigt: "Stigende kredittid kan være et bevidst valg for at vinde kunder – men også et tegn på, at kunderne har svært ved at betale.",
    model: "Butikker og webshops har få debitorer; virksomheder, der sælger til andre virksomheder, giver typisk 30 dage eller mere.",
    faldgrube:
      "Debitorerne står i balancen inklusive moms, mens omsætningen er uden moms. Derfor ser kredittiden længere ud, end den er. Og indgår der kontantsalg i omsætningen, ser den kortere ud.",
    relateret: ["kreditor-oh", "lager-oh", "pengestrom"],
  },
  "kreditor-oh": {
    kortSagt: "Hvor mange gange om året virksomheden betaler sine leverandører.",
    eksempel: "Varekøb 12 mio. kr. og leverandørgæld 1 mio. kr. giver 12 gange om året – virksomheden betaler efter ca. 30 dage.",
    forklaring:
      "Leverandørkredit er en form for rentefri finansiering: virksomheden får varerne nu og betaler senere. Nøgletallet viser, hvor lang kredit virksomheden får – eller tager. Del 365 med tallet for at få kreditordage.",
    hoej: "Virksomheden betaler hurtigt og bruger ikke meget leverandørkredit.",
    lav: "Lang kredit hos leverandørerne. Det kan være god forhandling – eller et tegn på, at virksomheden ikke kan betale til tiden.",
    vigtigt:
      "Sammenlign kreditordage med lagerdage og debitordage: hvis leverandørerne betaler for lageret, mens det ligger, og kunderne betaler, før leverandørerne skal have deres penge, bindes der næsten ingen kapital.",
    model: null,
    faldgrube:
      "At læse flere kreditordage som noget udelukkende godt. Hvis dagene stiger samtidig med, at likviditeten falder, kan det være et tegn på betalingsproblemer. Og leverandørgælden står også inklusive moms.",
    relateret: ["debitor-oh", "lager-oh", "likv1"],
  },
  pengestrom: {
    kortSagt: "Hvor mange rigtige kroner hver 100 kr. i salg bringer ind fra driften.",
    eksempel: "Omsætning 20 mio. kr. og pengestrøm fra primær drift 2 mio. kr. giver 10 %.",
    forklaring:
      "Et overskud i resultatopgørelsen er ikke det samme som penge i banken. Hvis overskuddet bliver bundet i større lager eller længere kundekredit, kommer pengene ikke ind. Nøgletallet viser, hvor god virksomheden er til at gøre salg til kontanter.",
    hoej: "Driften skaber rigtige penge – til investeringer, afdrag eller udbytte.",
    lav: "Overskuddet sidder fast i lager og tilgodehavender, eller driften giver ikke overskud.",
    vigtigt:
      "Pengestrømmen afslører, om et flot resultat også er et sundt resultat. Sammenlign med overskudsgraden: ligger pengestrømmen markant under, er overskuddet bundet i driftskapital.",
    model: null,
    faldgrube: "At tro, at resultat og pengestrøm er det samme. En virksomhed i hurtig vækst kan tjene penge og alligevel løbe tør for kontanter.",
    relateret: ["og", "lager-oh", "debitor-oh", "likv1"],
  },

  /* ---------------- Soliditet og likviditet ---------------- */
  soliditetsgrad: {
    kortSagt: "Hvor stor en del af virksomheden ejerne selv har betalt.",
    eksempel: "Egenkapital 4 mio. kr. og aktiver i alt 10 mio. kr. giver en soliditetsgrad på 40 %.",
    forklaring:
      "Soliditetsgraden viser, hvor stor en buffer der er, før kreditorerne lider tab. Med en soliditetsgrad på 40 % kan værdien af aktiverne falde med 40 %, før egenkapitalen er brugt op, og långivere og leverandører begynder at tabe penge.",
    hoej: "Robust: stor buffer mod tab og lettere adgang til lån.",
    lav: "Sårbar: små tab kan æde egenkapitalen, og långiverne vil kræve mere i rente eller sikkerhed.",
    vigtigt:
      "Det er bankens og leverandørernes første tal: kan de regne med at få deres penge? Soliditeten er modstykket til gearingen – jo højere gearing, jo lavere soliditet.",
    model: null,
    faldgrube:
      "At tro, at højere altid er bedre. En meget høj soliditet betyder lav gearing – og dermed at ejerne ikke får det løft, lån kan give, når driften går godt.",
    relateret: ["gearing", "ekf", "kapitalbinding"],
  },
  anlaegsgrad: {
    kortSagt: "Hvor stor en del af virksomhedens aktiver der er langvarige investeringer.",
    eksempel: "Anlægsaktiver 6 mio. kr. og aktiver i alt 10 mio. kr. giver en anlægsgrad på 60 %.",
    forklaring:
      "Anlægsgraden viser, hvor stor en del af kapitalen der er bundet på lang sigt i bygninger, maskiner og immaterielle aktiver – og hvor meget der er i omsætningsaktiver (lager, tilgodehavender, likvider), som hurtigere kan blive til penge.",
    hoej: "En kapitaltung forretning: mange faste investeringer, der skal finansieres langsigtet.",
    lav: "En let forretning: kapitalen er mest i lager, tilgodehavender og likvider.",
    vigtigt: "Anlægsgraden er ikke god eller dårlig i sig selv – men den fortæller, hvilken slags virksomhed det er, og hvordan den bør finansieres.",
    model: "Et af de tydeligste spor til forretningsmodellen: egen fabrik eller egne butikker giver høj anlægsgrad; handel og rådgivning lav.",
    faldgrube: "At vurdere den som 'for høj' eller 'for lav' uden at se på forretningsmodellen.",
    relateret: ["kapitalbinding", "anlaeg-oh", "soliditetsgrad"],
  },
  kapitalbinding: {
    kortSagt: "Om de langvarige investeringer er betalt med langvarige penge.",
    eksempel: "Anlægsaktiver 6 mio. kr. og langfristet kapital (egenkapital + langfristet gæld) 8 mio. kr. giver 0,75.",
    forklaring:
      "Den gyldne finansieringsregel siger, at det, der skal bruges i mange år, skal finansieres med penge, der står til rådighed i mange år. Kapitalbindingsgraden sammenligner anlægsaktiverne med egenkapital og langfristet gæld.",
    hoej: "Over 1: en del af anlæggene er finansieret med kortfristet gæld, der kan blive krævet betalt, før anlægget har tjent pengene hjem.",
    lav: "Under 1: anlæggene er dækket af langfristet kapital, og der er langsigtede penge til overs til lager og tilgodehavender.",
    vigtigt: "En kapitalbindingsgrad over 1 er et advarselstegn for likviditeten, selvom soliditeten ser fin ud.",
    model: null,
    faldgrube: "At forveksle den med anlægsgraden. Anlægsgraden ser på aktivsiden alene; kapitalbindingsgraden holder aktiverne op mod finansieringen.",
    relateret: ["anlaegsgrad", "soliditetsgrad", "likv1"],
  },
  likv1: {
    kortSagt: "Om virksomheden kan betale den gæld, der forfalder inden for et år – uden at sælge ud af lageret.",
    eksempel: "Omsætningsaktiver uden lager 3 mio. kr. og kortfristet gæld 2,5 mio. kr. giver 120 %.",
    forklaring:
      "Likviditetsgrad I sammenligner det, der hurtigt kan blive til penge (tilgodehavender og likvider), med den gæld, der skal betales inden for et år. Varelageret er holdt ude, fordi det kan tage tid at sælge – og måske kun til nedsat pris.",
    hoej: "Over 100 %: virksomheden kan betale sin kortfristede gæld med de penge, der er på vej ind.",
    lav: "Under 100 %: virksomheden er afhængig af at sælge lageret eller af bankens velvilje for at betale sine regninger.",
    vigtigt:
      "Det er den strenge test for betalingsevnen på kort sigt. En virksomhed kan være solid og alligevel gå konkurs, hvis den ikke kan betale regningerne i tide.",
    model: null,
    faldgrube:
      "At tro, at meget høj altid er godt. Store likvide beholdninger, der bare står, giver intet afkast og trækker afkastningsgraden ned. Og husk, at tallet er et øjebliksbillede af balancedagen.",
    relateret: ["likv2", "kapitalbinding", "pengestrom", "soliditetsgrad"],
  },
  likv2: {
    kortSagt: "Om virksomheden kan betale den kortfristede gæld, når lageret regnes med.",
    eksempel: "Omsætningsaktiver 5 mio. kr. og kortfristet gæld 2,5 mio. kr. giver 200 %.",
    forklaring:
      "Likviditetsgrad II er den mildere test: her tæller hele omsætningsformuen med – også varelageret. Forskellen mellem likviditetsgrad I og II viser, hvor meget af betalingsevnen der hviler på, at lageret bliver solgt.",
    hoej: "Omsætningsaktiverne dækker den kortfristede gæld flere gange.",
    lav: "Selv når lageret regnes med, er der ikke meget at betale gælden med.",
    vigtigt: "Sammenlign de to likviditetsgrader: er II meget højere end I, er betalingsevnen afhængig af lageret.",
    model: null,
    faldgrube:
      "At lade en høj likviditetsgrad II berolige sig. Et stort lager kan være svært at sælge – og et voksende lager kan netop være problemet, du fandt under kapitaltilpasning.",
    relateret: ["likv1", "lager-oh"],
  },

  /* ---------------- Børsrelaterede ---------------- */
  eps: {
    kortSagt: "Hvor mange kroner i overskud der er tjent til hver aktie.",
    eksempel: "Årets resultat 5 mio. kr. og 1 mio. aktier giver 5 kr. pr. aktie.",
    forklaring:
      "Resultat pr. aktie deler årets resultat ud på aktierne, så investoren kan se, hvad hver aktie har tjent. Det er grundlaget for P/E-værdien.",
    hoej: "Der tjenes meget pr. aktie.",
    lav: "Der tjenes lidt pr. aktie – eller antallet af aktier er steget.",
    vigtigt: "Udviklingen over tid er det interessante: stiger resultat pr. aktie, bliver hver aktie mere værd at eje.",
    model: null,
    faldgrube:
      "At sammenligne resultat pr. aktie mellem to virksomheder. Antallet af aktier er vilkårligt, så kun udviklingen i samme virksomhed giver mening. Udsteder virksomheden nye aktier, falder tallet, selvom resultatet er uændret.",
    relateret: ["pe", "indrevaerdi"],
  },
  pe: {
    kortSagt: "Hvor mange års overskud man betaler, når man køber aktien.",
    eksempel: "Kurs 100 kr. og resultat pr. aktie 5 kr. giver en P/E på 20 – man betaler 20 års overskud.",
    forklaring:
      "P/E-værdien viser prisen på aktien i forhold til det, den tjener. Den afspejler investorernes forventninger til fremtiden: tror de på vækst, er de villige til at betale mange års overskud.",
    hoej: "Markedet forventer vækst eller ser virksomheden som sikker – eller aktien er dyr.",
    lav: "Markedet er skeptisk over for fremtiden – eller aktien er billig.",
    vigtigt: "P/E er markedets dom over virksomhedens fremtid. Sammenholdt med din egen analyse kan du vurdere, om markedet er for optimistisk eller pessimistisk.",
    model: null,
    faldgrube:
      "At læse en stigende P/E som et tegn på, at det går godt. Falder resultatet, mens kursen står stille, stiger P/E også. Og ved underskud giver P/E ingen mening.",
    relateret: ["eps", "ki"],
  },
  indrevaerdi: {
    kortSagt: "Hvor mange kroner egenkapital der står bag hver aktie ifølge regnskabet.",
    eksempel: "Egenkapital 30 mio. kr. og 1 mio. aktier giver en indre værdi på 30 kr. pr. aktie.",
    forklaring:
      "Indre værdi er den regnskabsmæssige værdi af en aktie: det, ejerne ville have tilbage pr. aktie, hvis alle aktiver blev solgt til den værdi, de står til i balancen, og al gæld blev betalt.",
    hoej: "Der står meget egenkapital bag hver aktie.",
    lav: "Der står lidt egenkapital bag hver aktie.",
    vigtigt: "Indre værdi er udgangspunktet for at vurdere, om aktien handles over eller under det, regnskabet siger, den er værd.",
    model: null,
    faldgrube:
      "At tro, at indre værdi er aktiens 'rigtige' værdi. Balancen viser historiske værdier og mangler ofte det vigtigste: brand, kunder og medarbejdernes viden.",
    relateret: ["ki", "eps"],
  },
  ki: {
    kortSagt: "Hvor mange kroner investorerne betaler for hver krone egenkapital i regnskabet.",
    eksempel: "Kurs 45 kr. og indre værdi 30 kr. giver 1,5 – man betaler 1,50 kr. for hver krone egenkapital.",
    forklaring:
      "Kurs/indre værdi sammenligner markedets pris med regnskabets værdi. Er tallet over 1, mener markedet, at virksomheden er mere værd, end balancen viser – typisk fordi den forventes at tjene gode penge i fremtiden eller har værdier, der ikke står i balancen.",
    hoej: "Markedet tror på fremtidig indtjening, eller virksomheden har skjulte værdier som brand og knowhow.",
    lav: "Under 1: markedet tror ikke på, at aktiverne er det værd, de står til – eller forventer tab.",
    vigtigt:
      "Sammen med P/E viser tallet investorernes vurdering af fremtiden. Kurs/indre værdi hænger tilnærmelsesvis sammen med de to andre: K/I ≈ P/E × egenkapitalens forrentning.",
    model: null,
    faldgrube: "At tolke et tal under 1 som en god handel. Der kan være en grund til, at markedet vurderer virksomheden lavt.",
    relateret: ["pe", "indrevaerdi", "ekf"],
  },
};
