import RegisterView from "@/components/views/RegisterView";

// URL: /register/0x1234...abcd   →  params.ref = "0x1234...abcd"
export default function Page({ params }: { params: { ref: string } }) {
  const ref = decodeURIComponent(params.ref);
  return <RegisterView initialRef={ref} />;
}
