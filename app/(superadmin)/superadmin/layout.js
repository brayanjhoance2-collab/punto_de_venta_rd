// app/(main)/layout.jsx
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import HeaderSuperAdmin from "@/_Pages/superadmin/header/header";
export default function MainLayout({ children }) {
  return (
    <>
      <div>
        <ClienteWrapper>
          <HeaderSuperAdmin></HeaderSuperAdmin>
        </ClienteWrapper>
      </div>
      {children}
    </>
  );
}