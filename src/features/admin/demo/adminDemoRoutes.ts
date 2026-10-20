export function adminDemoHref(section:string,view?:string) {
  const path=section==='panel'?'/admin':`/admin/${section}`;
  return view?`${path}?vista=${encodeURIComponent(view)}`:path;
}
