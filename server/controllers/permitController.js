import Permit from "../models/Permit.js";
import Staff from "../models/Staff.js";

export async function listPermits(req, res, next) {
  try {
    const status = req.query.status;
    const filter = {};
    if (status) filter.status = status;

    const items = await Permit.find(filter)
      .populate("staffId", "fullName email employeeNo")
      .sort({ endDate: 1 });

    res.json({ items });
  } catch (e) {
    next(e);
  }
}

export async function createPermit(req, res, next) {
  try {
    const {
      staffId,
      type = "在留資格",
      status = "active",
      startDate = null,
      endDate,
      note = "",
    } = req.body || {};

    if (!staffId || !endDate) {
      return res.status(400).json({ message: "staffId dan endDate wajib" });
    }

    const staff = await Staff.findById(staffId);
    if (!staff) return res.status(404).json({ message: "Staff not found" });

    const permit = await Permit.create({
      staffId,
      type,
      status,
      startDate,
      endDate,
      note,
    });

    const populated = await Permit.findById(permit._id).populate(
      "staffId",
      "fullName email employeeNo"
    );

    res.status(201).json({ permit: populated });
  } catch (e) {
    next(e);
  }
}

export async function updatePermit(req, res, next) {
  try {
    const permit = await Permit.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).populate("staffId", "fullName email employeeNo");

    if (!permit) return res.status(404).json({ message: "Permit not found" });
    res.json({ permit });
  } catch (e) {
    next(e);
  }
}

export async function deletePermit(req, res, next) {
  try {
    const permit = await Permit.findByIdAndDelete(req.params.id);
    if (!permit) return res.status(404).json({ message: "Permit not found" });
    res.json({ message: "Deleted" });
  } catch (e) {
    next(e);
  }
}