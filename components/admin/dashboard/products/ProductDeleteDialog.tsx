"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { IProduct } from "@/interfaces/IProduct";
import { Loader2 } from "lucide-react";
import { useState } from "react";



interface ProductDeleteDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: Partial<IProduct>) => Promise<void>;
    deletingProduct: IProduct | null;
}

export function ProductDeleteDialog({
    open,
    onOpenChange,
    onSubmit,
    deletingProduct,
}: ProductDeleteDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSubmit = async () => {
        if (deletingProduct) {
            setIsDeleting(true);
            await onSubmit(deletingProduct);
            setIsDeleting(false);
        }
    };


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="text-left">
                        Eliminar producto
                    </DialogTitle>
                    <DialogDescription className="text-left">
                        ¿Queres eliminar el producto {deletingProduct?.nombre}?
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="flex flex-col gap-3 mt-2 sm:gap-2 sm:flex-row">
                    <Button variant={'secondary'} onClick={() => onOpenChange(false)} type="button" disabled={isDeleting}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} type="button" disabled={isDeleting}>
                        {isDeleting && <Loader2 className="animate-spin" size={16} />}
                        Eliminar producto
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

