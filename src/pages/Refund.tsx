import { Helmet } from "react-helmet-async";

export default function Refund() {
  return (
    <>
      <Helmet>
        <title>Refund & Return Policy — Ranya Ibrahim Ahmed</title>
        <meta name="description" content="Refund and return policy for Ranya Ibrahim Ahmed's store. 14-day returns, refund process, and shipping details." />
        <link rel="canonical" href="https://aunty-ranya-website.vercel.app/refund" />
        <meta name="robots" content="index, follow" />
      </Helmet>
      <div className="min-h-screen pt-28 pb-20">
        <div className="container max-w-3xl">
          <h1 className="text-4xl font-extrabold">Refund & Return Policy</h1>
          <p className="mt-4 text-muted-foreground">
            We want you to be completely satisfied with your purchase. If you are not entirely happy with your order, we're here to help.
          </p>

          <h2 className="mt-8 text-2xl font-extrabold">Returns</h2>
          <p className="mt-2 text-muted-foreground">
            You have 14 calendar days to return an item from the date you received it. To be eligible for a return, your item must be unused and in the same condition that you received it. Your item must be in the original packaging. You must have the receipt or proof of purchase.
          </p>

          <h2 className="mt-8 text-2xl font-extrabold">Refunds</h2>
          <p className="mt-2 text-muted-foreground">
            Once we receive your item, we will inspect it and notify you that we have received your returned item. We will immediately notify you on the status of your refund after inspecting the item. If your return is approved, we will initiate a refund to your original method of payment. You will receive the credit within a certain amount of days, depending on your card issuer's policies.
          </p>

          <h2 className="mt-8 text-2xl font-extrabold">Shipping</h2>
          <p className="mt-2 text-muted-foreground">
            You will be responsible for paying for your own shipping costs for returning your item. Shipping costs are non-refundable. If you receive a refund, the cost of return shipping will be deducted from your refund.
          </p>

          <h2 className="mt-8 text-2xl font-extrabold">Contact Us</h2>
          <p className="mt-2 text-muted-foreground">
            If you have any questions on how to return your item to us, contact us at{" "}
            <a className="text-primary font-semibold underline-offset-4 hover:underline" href="mailto:aroaajm@gmail.com">aroaajm@gmail.com</a>.
          </p>
        </div>
      </div>
    </>
  );
}
