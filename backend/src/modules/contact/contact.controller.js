import asyncHandler from "../../utils/asyncHandler.js";
import ApiResponse from "../../utils/ApiResponse.js";
import ContactService from "./contact.service.js";

class ContactController {
  // POST /api/contact  (público, CU-020 aprox — página /contacto)
  send = asyncHandler(async (req, res) => {
    await ContactService.send(req.body);
    res.status(201).json(
      ApiResponse.success(
        "Tu mensaje fue enviado correctamente. Te responderemos pronto."
      )
    );
  });
}

export default new ContactController();
