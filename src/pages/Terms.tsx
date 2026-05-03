import { Helmet } from "react-helmet-async";

export default function Terms() {
  return (
    <>
      <Helmet>
        <title>Terms of Service — Ranya Ibrahim Ahmed</title>
        <meta name="description" content="Terms of service for Ranya Ibrahim Ahmed's website and store." />
      </Helmet>
      <div className="min-h-screen pt-28 pb-20">
        <div className="container max-w-3xl">
          <h1 className="text-4xl font-extrabold">Terms of Service</h1>
          <p className="mt-4 text-muted-foreground">
            These Terms of Service govern your use of our website and the purchase of products and services offered by Ranya Ibrahim Ahmed. By accessing or using the website, you agree to be bound by these Terms.
          </p>

          <h2 className="mt-8 text-2xl font-extrabold">Online Store Terms</h2>
          <p className="mt-2 text-muted-foreground">
            By agreeing to these Terms of Service, you represent that you are at least the age of majority in your state or province of residence, or that you are the age of majority in your state or province of residence and you have given us your consent to allow any of your minor dependents to use this site. You may not use our products for any illegal or unauthorized purpose nor may you, in the use of the Service, violate any laws in your jurisdiction.
          </p>

          <h2 className="mt-8 text-2xl font-extrabold">Accuracy of Information</h2>
          <p className="mt-2 text-muted-foreground">
            We are not responsible if information made available on this site is not accurate, complete or current. The material on this site is provided for general information only and should not be relied upon or used as the sole basis for making decisions without consulting primary, more accurate, more complete or more timely sources of information.
          </p>

          <h2 className="mt-8 text-2xl font-extrabold">Contact Us</h2>
          <p className="mt-2 text-muted-foreground">
            Questions about the Terms of Service should be sent to us at{" "}
            <a className="text-primary font-semibold underline-offset-4 hover:underline" href="mailto:aroaajm@gmail.com">aroaajm@gmail.com</a>.
          </p>
        </div>
      </div>
    </>
  );
}
