import Script from "next/script";

export function TawkProvider() {
  return (
    <Script id="tawk-to" strategy="afterInteractive">
      {`
var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
(function(){
var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
s1.async=true;
s1.src='https://embed.tawk.to/6a158d56ed91441c326ca651/default';
s1.charset='UTF-8';
s1.setAttribute('crossorigin','*');
s0.parentNode.insertBefore(s1,s0);
})();
      `}
    </Script>
  );
}
