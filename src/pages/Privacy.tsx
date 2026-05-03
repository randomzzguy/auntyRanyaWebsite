import { Helmet } from "react-helmet-async";

export default function Privacy() {
  return (
    <>
      <Helmet>
        <title>Privacy Policy — Ranya Ibrahim Ahmed</title>
        <meta name="description" content="Privacy policy for Ranya Ibrahim Ahmed's website and store." />
      </Helmet>
      <div className="min-h-screen pt-28 pb-20">
        <div className="container max-w-3xl">
          <h1 className="text-4xl font-extrabold">Privacy Policy</h1>
          <p className="mt-4 text-muted-foreground">
            This Privacy Policy describes how your personal information is collected, used, and shared when you visit or make a purchase from our website.
          </p>

          <h2 className="mt-8 text-2xl font-extrabold">Information We Collect</h2>
          <p className="mt-2 text-muted-foreground">
            When you visit the site, we automatically collect certain information about your device, including information about your web browser, IP address, time zone, and some of the cookies that are installed on your device. Additionally, as you browse the site, we collect information about the individual web pages or products that you view, what websites or search terms referred you to the site, and information about how you interact with the site.
          </p>
          <p className="mt-2 text-muted-foreground">
            When you make a purchase or attempt to make a purchase through the site, we collect certain information from you, including your name, billing address, shipping address, payment information, email address, and phone number.
          </p>

          <h2 className="mt-8 text-2xl font-extrabold">How We Use Your Information</h2>
          <p className="mt-2 text-muted-foreground">
            We use the Order Information that we collect generally to fulfill any orders placed through the site (including processing your payment information, arranging for shipping, and providing you with invoices and/or order confirmations). Additionally, we use this Order Information to communicate with you, screen our orders for potential risk or fraud, and when in line with the preferences you have shared with us, provide you with information or advertising relating to our products or services.
          </p>

          <h2 className="mt-8 text-2xl font-extrabold">Contact Us</h2>
          <p className="mt-2 text-muted-foreground">
            For more information about our privacy practices, if you have questions, or if you would like to make a complaint, please contact us by email at{" "}
            <a className="text-primary font-semibold underline-offset-4 hover:underline" href="mailto:aroaajm@gmail.com">aroaajm@gmail.com</a>.
          </p>
        </div>
      </div>
    </>
  );
}
