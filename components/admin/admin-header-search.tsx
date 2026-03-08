"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlobalSearchInput } from "@/components/common/global-search-input";

export default function AdminHeaderSearch() {
  const router = useRouter();
  const [value, setValue] = useState("");

  const handleEnter = () => {
    const query = value.trim();
    if (!query) return;
    router.push(`/research?search=${encodeURIComponent(query)}`);
  };

  return (
    <GlobalSearchInput
      value={value}
      onChange={setValue}
      onEnter={handleEnter}
      placeholder="Search research..."
      className="w-full max-w-sm"
    />
  );
}

