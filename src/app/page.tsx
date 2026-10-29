import PublicHome from '@/features/public/PublicHome';
export default function Home(){return <PublicHome loadPublished={process.env.VILLA_SERENA_BFF_MODE!=='demo'}/>;}
