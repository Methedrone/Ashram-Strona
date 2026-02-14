import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware((context, next) => {
  const url = context.url;
  
  if (url.pathname.startsWith('/pl/') || url.pathname === '/pl') {
    const newPath = url.pathname.replace(/^\/pl/, '') || '/';
    return context.redirect(newPath, 301);
  }
  
  return next();
});
