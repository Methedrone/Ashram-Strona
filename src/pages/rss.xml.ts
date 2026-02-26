import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET() {
  const siteUrl = 'https://babaji.org.pl';
  const lang = 'pl';
  
  // Get all Polish events
  const allEvents = await getCollection('events', ({ data }) => {
    return data.lang === lang;
  });
  
  // Sort by date (ascending)
  const sortedEvents = allEvents.sort((a, b) => a.data.date.valueOf() - b.data.date.valueOf());
  
  // Filter: upcoming + last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentEvents = sortedEvents.filter(event => event.data.date >= thirtyDaysAgo).slice(0, 20);
  
  // Get all Polish teachings
  const allTeachings = await getCollection('teachings', ({ data }) => {
    return data.lang === lang;
  });
  
  // Sort by date (descending - newest first)
  const sortedTeachings = allTeachings.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
  
  // Take latest 10 teachings
  const recentTeachings = sortedTeachings.slice(0, 10);
  
  // Build RSS items
  const items = [
    ...recentEvents.map(event => ({
      title: event.data.title,
      description: event.data.description,
      link: `/events/${event.slug.split('/').slice(1).join('/')}`,
      pubDate: event.data.date,
      customData: `<language>pl</language>`,
    })),
    ...recentTeachings.map(teaching => ({
      title: teaching.data.title,
      description: teaching.data.description,
      link: `/teachings/${teaching.slug.split('/').slice(1).join('/')}`,
      pubDate: teaching.data.date,
      customData: `<language>pl</language>`,
    })),
  ];
  
  // Sort all items by date (newest first)
  items.sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf());
  
  return rss({
    title: 'Ashram Babaji - Wydarzenia i Nauki',
    description: 'Najnowsze wydarzenia i nauki z Ashramu Babaji w Mąkolnie',
    site: siteUrl,
    items: items,
    customData: `<language>pl</language>
<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>`,
  });
}
