import WhaleProfilePage from "./whale-profile-client";

export function generateStaticParams() {
  return [
    { id: "w1" }, { id: "w2" }, { id: "w3" }, { id: "w4" }, { id: "w5" },
    { id: "w6" }, { id: "w7" }, { id: "w8" }, { id: "w9" }, { id: "w10" },
    { id: "w11" }, { id: "w12" }, { id: "w13" }, { id: "w14" }, { id: "w15" },
  ];
}

export default function Page() {
  return <WhaleProfilePage />;
}
