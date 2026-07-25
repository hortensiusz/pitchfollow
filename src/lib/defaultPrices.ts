import type { PriceItem } from './types';

export const DEFAULT_PRICES: PriceItem[] = [
  {
    name: 'Profile Platform (annual)',
    unit: 'year',
    price: 7000,
    desc: 'Amplify your ranking and be more discoverable across search\nFully customisable profiles: top line figures, notable work, key clients, media, key people\nAccess embargoed rankings four weeks ahead of guide launch\nQuote Image Generator - turn client testimonials into branded tiles in a few clicks\nReferee Management and Research Analytics to support your submissions\nFirms with Profile Platform average 2.7x more page views',
    kw: 'profile,ranking,visibility,referee,embargoed,marketing,SEO,brand,search',
  },
  {
    name: 'Market Pulse (annual)',
    unit: 'year',
    price: 6000,
    desc: 'Quickly understand current and prospective client needs, powered by 200,000 annual responses from law firm clients\nPrepare faster for client meetings\nInform your thought leadership strategy and focus your business development efforts\nTrack custom segments by location and practice area, updated monthly\nMulti-region coverage from the Americas to Europe, Asia-Pacific and Greater China',
    kw: 'trend,market,client needs,BD,business development,thought leadership,segment,pulse',
  },
  {
    name: 'Chambers Insight - CMI Report',
    unit: 'report',
    price: 3250,
    desc: 'Do not submit in the dark - tailored analysis of how your submission influenced ranking decisions\nDeeply understand your rankings with objective evidence for stakeholder questions\nBenchmark your brand and reputation against up to three competitors\nConsistent intake of client feedback from your most important referees\nAn annual performance review for your department vs the competition',
    kw: 'insight,feedback,submission,ranking rationale,competitor,benchmark,client service,CMI,satisfaction',
  },
  {
    name: 'Chambers Insight - CI Report',
    unit: 'report',
    price: 2450,
    desc: 'Consistent intake of client feedback from your most important referees\nTailored analysis of how your submission influenced ranking decisions\nDeeply understand your rankings with objective evidence for stakeholder questions\nAn annual performance review for your department',
    kw: 'insight,client intelligence,CI,feedback,submission,ranking rationale,client service,satisfaction,referee',
  },
  {
    name: 'Digital Insight (Profile Platform + CMI bundle)',
    unit: 'year',
    price: 8850,
    desc: 'Profile Platform and CMI Report bundled, delivered digitally in MyAccount\nExport your reports to Word, Excel and PDF\nUnlocks the Rankings Data Hub - ranking data from two weeks before guide launch, refreshed daily',
    kw: 'digital insight,bundle,package,rankings data hub,RDH,export',
  },
  {
    name: 'In-Depth Overview (annual)',
    unit: 'year',
    price: 4000,
    desc: 'Exclusive thought leadership article displayed above the Chambers rankings tables\nExpert-level insight into the state of the legal market - highly visible, effortless\nUp to five authors, 500-1500 words, editable year-round\nLinks back to your firm and individual profiles',
    kw: 'overview,thought leadership,article,practice area,author',
  },
  {
    name: 'Overview Feature add-on',
    unit: 'item',
    price: 1500,
    desc: 'Optional Feature add-on for your In-Depth Overview for greater prominence',
    kw: 'feature,add-on',
  },
  {
    name: 'Practice Analytics',
    unit: 'year',
    price: 5000,
    desc: 'Benchmark your practice against the market with rich analytics\nTrack trends in rankings, submissions, and market share over time\nIdentify growth opportunities and competitive threats',
    kw: 'analytics,practice analytics,benchmark,data,market share,trend',
  },
];
