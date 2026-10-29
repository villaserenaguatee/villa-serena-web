export function visiblePhotoUrls(node:HTMLElement|null):string[]{
 if(!node)return [];
 const images=node.tagName==='IMG'?[node as HTMLImageElement]:Array.from(node.querySelectorAll<HTMLImageElement>('img'));
 const urls=images.map(image=>image.currentSrc||image.src).filter(Boolean);
 const background=node.ownerDocument.defaultView?.getComputedStyle(node).backgroundImage??'';
 for(const match of background.matchAll(/url\(["']?(.*?)["']?\)/g))if(match[1])urls.push(match[1]);
 return [...new Set(urls)];
}
