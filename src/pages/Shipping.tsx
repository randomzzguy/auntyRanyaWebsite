import { Helmet } from "react-helmet-async";

export default function Shipping() {
  return (
    <>
      <Helmet>
        <title>Shipping Policy — Ranya Ibrahim Ahmed</title>
        <meta name="description" content="Shipping policy for Ranya Ibrahim Ahmed's store." />
      </Helmet>
      <div className="min-h-screen pt-28 pb-20">
        <div className="container max-w-3xl">
          <h1 className="text-4xl font-extrabold">Shipping Policy</h1>
          <p className="mt-4 text-muted-foreground">
            We aim to deliver your books and services as quickly and safely as possible. Below you will find details about our shipping process and estimated delivery times within Egypt.
          </p>

          <h2 className="mt-8 text-2xl font-extrabold">Processing Time</h2>
          <p className="mt-2 text-muted-foreground">
            All orders are processed within 1–2 business days. Orders are not shipped or delivered on weekends or holidays. If we are experiencing a high volume of orders, shipments may be delayed by a few days. Please allow additional days in transit for delivery.
          </p>

          <h2 className="mt-8 text-2xl font-extrabold">Shipping Rates & Delivery Estimates</h2>
          <p className="mt-2 text-muted-foreground">
            Shipping within Alexandria is typically 1–2 business days. Shipping to other governorates in Egypt is typically 3–5 business days. Shipping rates are calculated at checkout based on your location.
          </p>

          <h2 className="mt-8 text-2xl font-extrabold">Shipment Confirmation & Order Tracking</h2>
          <p className="mt-2 text-muted-foreground">
            You will receive a Shipment Confirmation email once your order has shipped containing your tracking number(s). The tracking number will be active within 24 hours.
          </p>

          <h2 className="mt-8 text-2xl font-extrabold">Customs, Duties and Taxes</h2>
          <p className="mt-2 text-muted-foreground">
            Ranya Ibrahim Ahmed is not responsible for any customs and taxes applied to your order. All fees imposed during or after shipping are the responsibility of the customer (tariffs, taxes, etc.).
          </p>

          <h2 className="mt-8 text-2xl font-extrabold">Contact Us</h2>
          <p className="mt-2 text-muted-foreground">
            If you have any questions about shipping, please contact us at{" "}
            <a className="text-primary font-semibold underline-offset-4 hover:underline" href="mailto:aroaajm@gmail.com">aroaajm@gmail.com</a>.
          </p>
        </div>
      </div>
    </>
  );
}
