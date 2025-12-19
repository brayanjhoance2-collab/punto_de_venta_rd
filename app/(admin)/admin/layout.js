// app/(main)/layout.jsx
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import HeaderAdmin from "@/_Pages/admin/header/header";
export default function MainLayout({ children }) {
  return (
    <>
      <div>
        <ClienteWrapper>
          <HeaderAdmin></HeaderAdmin>
        </ClienteWrapper>
      </div>
      {children}
    </>
  );
}