import PublicAbout from '@/features/public/PublicAbout';
export default function Nosotros(){return <PublicAbout loadPublished={process.env.VILLA_SERENA_BFF_MODE!=='demo'}/>;}
