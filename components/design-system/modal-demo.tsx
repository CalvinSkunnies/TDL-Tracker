"use client";

import { useState } from "react";
import { Button, Modal } from "@/components/ui";

export function ModalDemo() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Open modal
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Discard this draft?"
        description="Your changes haven't been saved and can't be recovered."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Keep editing
            </Button>
            <Button onClick={() => setOpen(false)}>Discard draft</Button>
          </>
        }
      />
    </>
  );
}
