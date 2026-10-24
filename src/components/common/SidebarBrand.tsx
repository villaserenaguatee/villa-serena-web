import Image from 'next/image';
import styles from './SidebarBrand.module.css';
export default function SidebarBrand({module}:{module:string}){
 return <div className={styles.brand} data-vs-brand={module}><Image src="/villa-serena-logo.png" alt="Hotel Villa Serena" width={58} height={55} className={styles.logo}/><div className={styles.text}><span className={styles.name}>Villa Serena</span><span className={styles.module}>{module}</span></div></div>;
}
