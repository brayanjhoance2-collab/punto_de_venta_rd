// app/(main)/layout.jsx
import ClienteWrapper from "@/_EXTRAS/LadoCliente/ClienteWraper";
import HeaderVendedor from "@/_Pages/vendedor/header/header";

export default function MainLayout({ children }) {
  return (
    <>
      <div>
        <ClienteWrapper>
          <HeaderVendedor></HeaderVendedor>
        </ClienteWrapper>
      </div>
      {children}
    </>
  );
}