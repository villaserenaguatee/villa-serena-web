"use client";
import { usePublicLanguage } from './PublicLanguageToggle';
export default function PrivacyPolicyContent(){
 const {en}=usePublicLanguage();
 const sections=en?[
 ['Information we request','We ask for your name, email, phone number, identification document and booking details to manage your reservation and stay. We also record requests, messages, charges and documents related to the services you use.'],
 ['Use of information','We use this information to manage bookings, verify email addresses, provide portal access, handle check-in and check-out, deliver services and communicate about the stay.'],
 ['Payments','New online payments are made on Recurrente’s payment page. The hotel sends the booking reference, payment description, amount, currency and whether the payment is for a booking or an outstanding balance. You enter your card details on the provider’s page, not in the hotel’s booking form. Villa Serena records payment references, amounts and results to check payments and manage refunds. Previous payments keep their original provider information.'],
 ['Communications','The email address provided is used for verification, access codes, booking confirmation, invoices and other communications related to requested services. Staff may receive password recovery messages at the email address associated with their account.'],
 ['Access to information','Guest access is linked to their own bookings. Staff access information according to their role permissions. Documents and messages are associated with the relevant process or booking.'],
 ['Guest rights','You may contact the hotel to ask about your information or request corrections. Handling a request does not automatically delete associated bookings, payments, invoices or other records.']
 ]:[
 ['Información que solicitamos','Solicitamos tu nombre, apellidos, correo, teléfono, documento de identificación y datos de la reserva para gestionar tu alojamiento. También registramos las solicitudes, los mensajes, los consumos y los documentos relacionados con los servicios que utilizas.'],
 ['Uso de la información','Utilizamos estos datos para gestionar reservas, verificar el correo electrónico, permitir el acceso al portal, atender el check-in y check-out, prestar servicios y mantener comunicaciones relacionadas con la estancia.'],
 ['Pagos','Los pagos nuevos en línea se realizan en la página de pago de Recurrente. El hotel envía la referencia de la reserva, el concepto, el importe, la moneda y si se paga la reserva o un saldo pendiente. Introduces los datos de tu tarjeta en la página del proveedor, no en el formulario de reserva del hotel. Villa Serena registra las referencias, los importes y los resultados para comprobar los pagos y gestionar las devoluciones. Los pagos anteriores conservan la información de su proveedor original.'],
 ['Comunicaciones','El correo proporcionado se utiliza para la verificación, los códigos de acceso, la confirmación de reserva, el envío de facturas y otras comunicaciones relacionadas con los servicios solicitados. El personal puede recibir mensajes para recuperar su contraseña en el correo asociado a su cuenta.'],
 ['Acceso a la información','El acceso del huésped se vincula a sus propias reservas. El personal accede a la información conforme a los permisos de su función. Los documentos y mensajes se vinculan al proceso o reserva correspondiente.'],
 ['Derechos del huésped','Puedes contactar al hotel para consultar sobre tus datos o solicitar su corrección. La atención de una solicitud no implica eliminar automáticamente reservas, pagos, facturas u otros registros asociados.']
 ];
 return <><span className="section-kicker">VILLA SERENA</span><h1>{en?'Privacy policy':'Política de privacidad'}</h1>{sections.map(([title,text],i)=><section key={title}><h2>{i+1}. {title}</h2><p>{text}</p></section>)}<h2>{en?'7. Contact':'7. Contacto'}</h2><div className="legal-contact"><p><b>Villa Serena Hotel</b><br/>Huehuetenango, Guatemala<br/><a href="mailto:hotelvillaserena.gt@gmail.com">hotelvillaserena.gt@gmail.com</a></p></div></>;
}
