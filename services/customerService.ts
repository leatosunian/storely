import { CreateCustomerDTO, CustomerQuery, UpdateCustomerDTO } from "@/app/schemas/customerForm";
import { ICustomer } from "@/interfaces/ICustomer";
import connectDB from "@/lib/db/db";
import { CustomerModel } from "@/lib/db/models/customer";
import { FilterQuery } from "mongoose";

class CustomerService {
    async create(data: CreateCustomerDTO) {
        await connectDB();
        const existing = await CustomerModel.findOne({ email: data.email });
        if (existing) throw new Error("Ya existe un cliente con ese email");
        return CustomerModel.create(data);
    }

    async findAll(query: CustomerQuery) {
        await connectDB();
        const { page, limit, search, status, branchId, sortBy, sortOrder } = query;

        const filter: FilterQuery<ICustomer> = {};
        if (status) filter.status = status;
        if (branchId) filter.branchId = branchId;
        if (search) {
            const regex = new RegExp(search, "i");
            filter.$or = [
                { firstName: regex },
                { lastName: regex },
                { email: regex },
                { phone: regex },
            ];
        }

        const skip = (page - 1) * limit;
        const sort = { [sortBy]: sortOrder === "desc" ? -1 : 1 } as Record<string, 1 | -1>;
        const total = await CustomerModel.countDocuments(filter);
        const data = await CustomerModel.find(filter).sort(sort).skip(skip).limit(limit).lean();

        return { data, total, page, limit, pages: Math.ceil(total / limit) };
    }

    async findById(id: string) {
        await connectDB();
        const customer = await CustomerModel.findById(id).lean();
        if (!customer) throw new Error("Cliente no encontrado");
        return customer;
    }

    async update(id: string, data: UpdateCustomerDTO) {
        await connectDB();
        if (data.email) {
            const conflict = await CustomerModel.findOne({ email: data.email, _id: { $ne: id } });
            if (conflict) throw new Error("Ya existe un cliente con ese email");
        }
        const updated = await CustomerModel.findByIdAndUpdate(id, data, { new: true, runValidators: true }).lean();
        if (!updated) throw new Error("Cliente no encontrado");
        return updated;
    }

    async delete(id: string) {
        await connectDB();
        const updated = await CustomerModel.findByIdAndUpdate(id, { status: "inactive" }, { new: true }).lean();
        if (!updated) throw new Error("Cliente no encontrado");
        return updated;
    }

    async updateStats(customerId: string, orderTotal: number, session?: unknown) {
        await connectDB();
        return CustomerModel.findByIdAndUpdate(
            customerId,
            {
                $inc: { totalOrders: 1, totalSpent: orderTotal },
                $set: { lastOrderAt: new Date() },
            },
            // @ts-expect-error session type
            { session }
        );
    }
}

export const customerService = new CustomerService();