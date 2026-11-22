"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  CheckCircle2,
  Edit3,
  Heart,
  ImagePlus,
  Loader2,
  MessageSquareHeart,
  Send,
  Sparkles,
  Trash2,
  X,
  Maximize2,
  User,
  ArrowUpDown,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface NanoStoryProps {
  firstParagraphs: string[];
  remainingParagraphs: string[];
}

interface MemoryItem {
  id: string;
  image: string;
  captionMagdy: string;
  captionMena: string;
  date: string;
  createdAt: number;
}

/**
- تطبيع مصدر الصورة سواء رابط مباشر، قاعدة بيانات، أو صيغة شيت
 */
function normalizeImageSource(value: unknown): string {
  if (typeof value !== "string") return "";

  let raw = value.trim();
  if (!raw) return "";

  const formulaMatch = raw.match(/=IMAGE\(\s*["']([^"']+)["']/i);
  if (formulaMatch?.[1]) raw = formulaMatch[1].trim();

  raw = raw.replace(/^["']|["']$/g, "").trim();

  if (/^(https?:\/\/|data:image\/)/i.test(raw)) return raw;

  if (raw.length > 100 && /^[A-Za-z0-9+/=\s]+$/.test(raw)) {
    return `data:image/jpeg;base64,${raw.replace(/\s/g, "")}`;
  }

  return "";
}

function extractImageUrl(value: unknown): string {
  if (typeof value !== "string") return "";
  const text = value.trim();
  if (!text) return "";

  const cloudinaryMatch = text.match(/https?:\/\/res\.cloudinary\.com\/[^\s"'<>]+/i);
  if (cloudinaryMatch?.[0]) return cloudinaryMatch[0].replace(/[),.;]+$/, "");

  const imageMatch = text.match(/https?:\/\/[^\s"'<>]+\.(?:png|jpe?g|gif|webp|avif|bmp)(?:\?[^\s"'<>]*)?/i);
  if (imageMatch?.[0]) return imageMatch[0].replace(/[),.;]+$/, "");

  return "";
}

function parseStoredCaptions(value: string): { captionMagdy: string; captionMena: string } {
  const raw = String(value ?? "").trim();
  if (!raw) return { captionMagdy: "", captionMena: "" };

  const pick = (obj: any) => {
    const magdy = obj?.magdy ?? obj?.captionMagdy;
    const mena = obj?.mena ?? obj?.captionMena;
    return {
      captionMagdy: typeof magdy === "string" ? magdy : "",
      captionMena: typeof mena === "string" ? mena : "",
    };
  };

  let current: unknown = raw;
  for (let i = 0; i < 3; i++) {
    if (typeof current !== "string") break;
    try {
      current = JSON.parse(current);
    } catch {
      break;
    }
  }
  if (current && typeof current === "object" && !Array.isArray(current)) {
    return pick(current);
  }

  if (raw.includes('""')) {
    try {
      const fixed = raw.replace(/^"|"$/g, "").replace(/""/g, '"');
      const parsed = JSON.parse(fixed);
      if (parsed && typeof parsed === "object") return pick(parsed);
    } catch {}
  }

  const magdyMatch = raw.match(/"magdy"\s*:\s*"([\s\S]*?)"\s*(?:,\s*"mena"|\}\s*$)/);
  const menaMatch = raw.match(/"mena"\s*:\s*"([\s\S]*?)"\s*\}\s*$/);
  if (magdyMatch || menaMatch) {
    const unescape = (s: string) =>
      s.replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
    return {
      captionMagdy: magdyMatch ? unescape(magdyMatch[1]) : "",
      captionMena: menaMatch ? unescape(menaMatch[1]) : "",
    };
  }

  return { captionMagdy: raw, captionMena: "" };
}

function looksLikeCaptionJson(text: string): boolean {
  return /^\s*"?\{[\s\S]*"(magdy|mena|captionMagdy|captionMena)"\s*:/.test(text);
}

/**
 * ضغط الصورة قبل الرفع (بتصغّرها وبتحوّلها JPEG) عشان تعدّي حد Vercel
 */
async function compressImage(file: File, maxSize = 1600, quality = 0.82): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;

    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, "image/jpeg", quality)
    );
    if (!blob) return file;

    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", {
      type: "image/jpeg",
    });
  } catch {
    return file; // لو الضغط فشل نرفع الأصلية
  }
}

/**
 * مجموعة فقرات قابلة للفتح والقفل (بتظهر كلماتها بأنيميشن لما تتفتح)
 */
function CollapsibleGroup({
  id,
  title,
  paragraphs,
  isOpen,
  onToggle,
}: {
  id: string;
  title: string;
  paragraphs: string[];
  isOpen: boolean;
  onToggle: () => void;
}) {
  let wordCounter = 0;

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={id}
        className="w-full flex items-center justify-between gap-3 p-4 text-right cursor-pointer hover:bg-primary/5 transition-colors"
      >
        <span className="font-bold text-primary text-sm">{title}</span>
        <span className="text-xs font-semibold text-muted-foreground">
          {isOpen ? "إغلاق ▲" : "اضغط للقراءة ▼"}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 border-t border-primary/10 space-y-4">
              {paragraphs.map((paragraph, pIdx) => (
                <p
                  key={pIdx}
                  className="flex flex-wrap justify-start gap-x-1.5 gap-y-1"
                >
                  {paragraph.split(" ").map((word, wIdx) => {
                    const delay = Math.min(wordCounter, 120) * 0.03;
                    wordCounter++;
                    const randomX = ((wIdx * 17) % 15) - 7;
                    const randomY = ((pIdx * 13 + wIdx) % 12) - 6;

                    return (
                      <motion.span
                        key={`${pIdx}-${wIdx}`}
                        initial={{
                          opacity: 0,
                          x: randomX,
                          y: randomY,
                          scale: 1.15,
                          filter: "blur(4px)",
                        }}
                        animate={{
                          opacity: 1,
                          x: 0,
                          y: 0,
                          scale: 1,
                          filter: "blur(0px)",
                        }}
                        transition={{
                          duration: 0.35,
                          delay,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="relative inline-block"
                      >
                        {word}
                      </motion.span>
                    );
                  })}
                </p>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function NanoStory({
  firstParagraphs,
  remainingParagraphs,
}: NanoStoryProps) {
  // حالة فتح/قفل كل مجموعة من الفقرات
  const [openGroups, setOpenGroups] = useState({ first: false, remaining: false });
  const toggleGroup = (key: "first" | "remaining") =>
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [openParagraphs, setOpenParagraphs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successText, setSuccessText] = useState("");

  // حالة الترتيب: 'desc' (من الأحدث للأقدم) أو 'asc' (من الأقدم للأحدث)
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [captionMagdy, setCaptionMagdy] = useState("");
  const [captionMena, setCaptionMena] = useState("");
  const [date, setDate] = useState("");

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const formRef = useRef<HTMLFormElement | null>(null);

  const showSuccess = (text: string) => {
    setSuccessText(text);
    setTimeout(() => setSuccessText(""), 4000);
  };

  const fetchMemories = async () => {
    try {
      const resUrl = `/api/memories?t=${Date.now()}`;
      const fetchedRes = await fetch(resUrl, { cache: "no-store" });
      const data = await fetchedRes.json();

      if (Array.isArray(data)) {
        const formatted = data
          .map((item: any, index: number) => {
            const getValue = (key: string) => {
              if (item?.[key] !== undefined && item?.[key] !== null) return item[key];
              const actualKey = Object.keys(item || {}).find(
                (candidate) => candidate.toLowerCase().trim() === key.toLowerCase()
              );
              return actualKey ? item[actualKey] : "";
            };

            const id = getValue("id");
            const rawImage = getValue("image") || getValue("photo") || getValue("imageUrl");
            const rawCaption = String(getValue("caption") || getValue("message") || "");

            const normalizedImage = normalizeImageSource(rawImage) || extractImageUrl(rawImage);
            const imageFoundInCaption = normalizedImage ? "" : extractImageUrl(rawCaption);
            const image = normalizedImage || imageFoundInCaption;

            let magdyText = String(getValue("captionMagdy") || getValue("magdy") || "");
            let menaText = String(getValue("captionMena") || getValue("mena") || "");

            if (looksLikeCaptionJson(magdyText)) {
              const parsed = parseStoredCaptions(magdyText);
              magdyText = parsed.captionMagdy;
              menaText = menaText || parsed.captionMena;
            } else if (looksLikeCaptionJson(menaText)) {
              const parsed = parseStoredCaptions(menaText);
              menaText = parsed.captionMena;
              magdyText = magdyText || parsed.captionMagdy;
            } else if (!magdyText && !menaText && rawCaption) {
              const parsed = parseStoredCaptions(rawCaption);
              magdyText = parsed.captionMagdy;
              menaText = parsed.captionMena;
            }

            const createdAtNum = Number(getValue("createdAt"));

            return {
              id: id ? String(id) : String(index + Date.now()),
              image,
              captionMagdy: magdyText,
              captionMena: menaText,
              date: String(getValue("date") || "").split("T")[0],
              createdAt: Number.isFinite(createdAtNum) && createdAtNum > 0 ? createdAtNum : 0,
            } as MemoryItem;
          })
          .filter((item: MemoryItem) => item.id && (item.captionMagdy || item.captionMena || item.image));

        setMemories(formatted);
      }
    } catch (err) {
      console.error("Could not fetch memories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, []);

  // الترتيب المعتمد حصرياً على تاريخ البوست نفسه المرفق (ومقارنة وقت الإضافات لو التاريخ واحد)
  const sortedMemories = [...memories].sort((a, b) => {
    const dateA = a.date || "";
    const dateB = b.date || "";

    if (dateA && dateB && dateA !== dateB) {
      // لو التواريخ مختلفة، نرتب حسب تاريخ البوست
      return sortOrder === "desc" ? dateB.localeCompare(dateA) : dateA.localeCompare(dateB);
    }

    // لو التاريخ واحد، نرتب حسب وقت الإنشاء (الأحدث إضافتاً كاحتياطي)
    return sortOrder === "desc" ? b.createdAt - a.createdAt : a.createdAt - b.createdAt;
  });

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "desc" ? "asc" : "desc"));
  };

  const postToSheet = async (payload: Record<string, unknown>) => {
    const sheetApiUrl = process.env.NEXT_PUBLIC_SHEET_API_URL || "";

    if (!sheetApiUrl) {
      throw new Error("Google Sheets API URL is missing");
    }

    await fetch(sheetApiUrl, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showSuccess("من فضلك اختار ملف صورة صحيح");
      input.value = "";
      return;
    }

    const compressed = await compressImage(file);

    if (compressed.size > 4 * 1024 * 1024) {
      showSuccess("الصورة كبيرة أوي، جرب صورة تانية");
      input.value = "";
      return;
    }

    setSelectedFile(compressed);
    setImagePreview(URL.createObjectURL(compressed));
  };

  const resetForm = () => {
    setEditingId(null);
    setImagePreview("");
    setSelectedFile(null);
    setCaptionMagdy("");
    setCaptionMena("");
    setDate("");
  };

  const handleEditClick = (item: MemoryItem) => {
    setConfirmDeleteId(null);
    setEditingId(item.id);

    let oldImagePreview = item.image;
    if (item.image && !item.image.startsWith("http") && !item.image.startsWith("data:image") && item.image.length > 100) {
      oldImagePreview = `data:image/jpeg;base64,${item.image}`;
    }
    setImagePreview(oldImagePreview || "");
    setSelectedFile(null);

    setCaptionMagdy(item.captionMagdy || "");
    setCaptionMena(item.captionMena || "");

    const formattedDate = item.date ? String(item.date).split("T")[0] : "";
    setDate(formattedDate);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);

    try {
      await postToSheet({ action: "delete", id });
      setMemories((prev) => prev.filter((m) => m.id !== id));

      if (editingId === id) resetForm();

      setConfirmDeleteId(null);
      setDeletingId(null);
      showSuccess("تم مسح البوست من الألبوم نهائياً");

      setTimeout(() => {
        fetchMemories();
      }, 2500);
    } catch (err) {
      console.error("Error deleting memory:", err);
      setDeletingId(null);
      showSuccess("حصلت مشكلة أثناء مسح البوست");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!imagePreview && !captionMagdy.trim() && !captionMena.trim()) return;

    setSubmitting(true);

    try {
      let finalImage = imagePreview;
      let fileToUpload = selectedFile;

      if (!fileToUpload && editingId && imagePreview.startsWith("data:image")) {
        const oldImageBlob = await fetch(imagePreview).then((response) => response.blob());
        fileToUpload = new File([oldImageBlob], "memory-image.jpg", {
          type: oldImageBlob.type || "image/jpeg",
        });
      }

      if (fileToUpload) {
        const uploadData = new FormData();
        uploadData.append("file", fileToUpload);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: uploadData,
        });

        let uploadResult: any = null;
        try {
          uploadResult = await uploadResponse.json();
        } catch {}

        if (!uploadResponse.ok || !uploadResult?.url) {
          throw new Error(
            uploadResult?.error || `Upload failed (${uploadResponse.status})`
          );
        }

        finalImage = uploadResult.url;
      }

      const today = new Date().toISOString().split("T")[0];
      const finalDate = date.trim() !== "" ? date : today;
      const currentTime = Date.now();
      const wasEditing = Boolean(editingId);

      const payload = {
        action: editingId ? "update" : "create",
        id: editingId || currentTime.toString(),
        image: finalImage,
        captionMagdy: captionMagdy.trim(),
        captionMena: captionMena.trim(),
        date: finalDate,
        createdAt: currentTime,
      };

      await postToSheet(payload);

      setTimeout(() => {
        fetchMemories();
        resetForm();
        setSubmitting(false);
        showSuccess(
          wasEditing
            ? "تم تعديل البوست بنجاح ❤️"
            : "تم حفظ البوست في الألبوم بنجاح ❤️"
        );
      }, 2000);
    } catch (err) {
      console.error("Error saving memory:", err);
      showSuccess(
        `حصلت مشكلة أثناء رفع الصورة أو حفظ البوست${
          err instanceof Error ? ` (${err.message})` : ""
        }`
      );
      setSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
      dir="rtl"
      className="min-h-screen relative overflow-hidden"
    >
      <div className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] bg-primary/10 rounded-full blur-[100px]" />

      <div className="relative z-10 mx-auto w-full max-w-xl sm:max-w-2xl px-4 sm:px-6 py-8 sm:py-14 space-y-10 sm:space-y-14">
        
        {/* كارت الرسالة الأساسية */}
        <motion.section
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-card/90 backdrop-blur-xl border border-border/80 rounded-2xl sm:rounded-3xl p-5 sm:p-9 shadow-xl space-y-4 sm:space-y-6 text-right"
        >
          <div className="flex items-center justify-between border-b border-border/60 pb-3 sm:pb-4">
            <div className="flex items-center gap-2 text-primary text-xs sm:text-sm font-bold">
              <Sparkles className="w-4 h-4" />
              <span>رسالة من القلب</span>
            </div>
            <Heart className="w-4.5 h-4.5 text-primary fill-primary/30 animate-pulse" />
          </div>

          <div className="space-y-4 text-sm sm:text-base leading-[2.1] sm:leading-[2.2] text-foreground/90 font-medium">
            <CollapsibleGroup
              id="first-group"
              title="اول اعتذار"
              paragraphs={firstParagraphs}
              isOpen={openGroups.first}
              onToggle={() => toggleGroup("first")}
            />
            <CollapsibleGroup
              id="remaining-group"
              title="اول اعتراف بالحب"
              paragraphs={remainingParagraphs}
              isOpen={openGroups.remaining}
              onToggle={() => toggleGroup("remaining")}
            />
          </div>
        </motion.section>

        {/* فاصل توضيحي لمكان البوستات والذكريات وزرار الترتيب */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-card/60 backdrop-blur-md border border-border/80 px-4 py-3 rounded-2xl shadow-sm">
            <div className="text-center sm:text-right space-y-0.5">
              <div className="inline-flex items-center gap-1.5 text-primary text-[11px] sm:text-xs font-bold">
                <MessageSquareHeart className="w-3.5 h-3.5" />
                <span>مساحة البوستات وذكرياتنا المشتركة</span>
              </div>
              <h2 className="text-base sm:text-xl font-bold text-foreground">
                ألبوم ذكرياتنا الحلوة 📸❤️
              </h2>
            </div>

            {/* زرار تبديل الترتيب حسب تاريخ البوست */}
            <button
              type="button"
              onClick={toggleSortOrder}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary/10 hover:bg-primary/15 border border-primary/20 text-primary font-bold text-xs transition-colors cursor-pointer"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>
                {sortOrder === "desc" ? "حسب تاريخ البوست: من الأحدث للأقدم" : "حسب تاريخ البوست: من الأقدم للأحدث"}
              </span>
            </button>
          </div>
        </div>

        {/* 2. ألبوم الذكريات والبوستات */}
        <section className="space-y-6">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : sortedMemories.length === 0 ? (
            <div className="flex flex-col items-center gap-2.5 py-10 text-center text-muted-foreground border-2 border-dashed border-border rounded-2xl sm:rounded-3xl bg-card/40 px-4">
              <ImagePlus className="w-7 h-7 text-primary/70" />
              <p className="text-xs sm:text-sm">
                لسه مفيش بوستات أو ذكريات، ابدأ بأول ذكرى من الفورم أدناه
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {sortedMemories.map((item) => {
                const isConfirming = confirmDeleteId === item.id;
                const isDeleting = deletingId === item.id;

                const imageSrc = normalizeImageSource(item.image);
                const accessibleCaption = [item.captionMagdy, item.captionMena].filter(Boolean).join(" - ");

                return (
                  <motion.article
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-card/90 backdrop-blur-md border rounded-2xl sm:rounded-3xl overflow-hidden shadow-md flex flex-col group transition-colors ${
                      editingId === item.id ? "border-primary/60" : "border-border"
                    }`}
                  >
                    {imageSrc ? (
                      <div 
                        onClick={() => setLightboxImage(imageSrc)}
                        className="relative w-full aspect-[4/3] sm:aspect-video bg-muted overflow-hidden cursor-pointer group/img"
                        title="اضغط لتكبير الصورة"
                      >
                        <img
                          src={imageSrc}
                          alt={accessibleCaption || "ذكرى"}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            const target = e.currentTarget;
                            target.style.display = "none";
                            const parent = target.parentElement;
                            if (parent && !parent.querySelector(".fallback-placeholder")) {
                              const fallback = document.createElement("div");
                              fallback.className = "fallback-placeholder flex flex-col items-center justify-center h-full text-muted-foreground gap-1 text-xs bg-muted/80";
                              fallback.innerHTML = `<svg class="w-6 h-6 text-primary/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg><span>تعذر تحميل الصورة</span>`;
                              parent.appendChild(fallback);
                            }
                          }}
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="bg-background/80 backdrop-blur-md text-foreground px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 shadow-lg">
                            <Maximize2 className="w-3.5 h-3.5" /> تكبير الصورة
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full aspect-video bg-muted/60 flex flex-col items-center justify-center text-muted-foreground gap-1 text-xs">
                        <ImagePlus className="w-6 h-6 text-primary/40" />
                        <span>لا توجد صورة مرفقة</span>
                      </div>
                    )}

                    {/* خانات مجدي ومنه المعروضة بوضوح تحت الصورة */}
                    <div className="p-4 sm:p-6 flex-1 flex flex-col gap-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 items-stretch">
                        {/* بوكس مجدي */}
                        <div className="rounded-2xl bg-primary/5 border border-primary/20 p-3.5 sm:p-4 text-right flex flex-col justify-between space-y-2">
                          <div className="flex items-center gap-1.5 border-b border-primary/15 pb-2">
                            <span className="w-5 h-5 rounded-full bg-primary/15 text-primary flex items-center justify-center">
                              <User className="w-3 h-3" />
                            </span>
                            <h4 className="text-xs sm:text-sm font-extrabold text-primary tracking-wide">
                              مجدي
                            </h4>
                          </div>
                          {item.captionMagdy ? (
                            <p className="text-sm sm:text-[15px] font-medium text-foreground leading-[1.85] whitespace-pre-line break-words [overflow-wrap:anywhere] flex-1">
                              {item.captionMagdy}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground/70 italic py-2 flex-1">
                              لسه مجدي مكتبش كلامه هنا...
                            </p>
                          )}
                        </div>

                        {/* بوكس منه */}
                        <div className="rounded-2xl bg-rose-500/5 border border-rose-500/20 p-3.5 sm:p-4 text-right flex flex-col justify-between space-y-2">
                          <div className="flex items-center gap-1.5 border-b border-rose-500/15 pb-2">
                            <span className="w-5 h-5 rounded-full bg-rose-500/15 text-rose-500 flex items-center justify-center">
                              <Heart className="w-3 h-3 fill-rose-500/30" />
                            </span>
                            <h4 className="text-xs sm:text-sm font-extrabold text-rose-500 tracking-wide">
                              منه
                            </h4>
                          </div>
                          {item.captionMena ? (
                            <p className="text-sm sm:text-[15px] font-medium text-foreground leading-[1.85] whitespace-pre-line break-words [overflow-wrap:anywhere] flex-1">
                              {item.captionMena}
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground/70 italic py-2 flex-1">
                              لسه منه مكتبتش كلامها هنا...
                            </p>
                          )}
                        </div>
                      </div>

                      {/* شريط التاريخ وأزرار التحكم */}
                      <div className="pt-3 border-t border-border/60 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-2 text-xs text-muted-foreground">
                        {isConfirming ? (
                          <>
                            <span className="font-semibold text-destructive text-xs">
                              مسح البوست ده؟
                            </span>
                            <div className="flex flex-col sm:flex-row w-full sm:w-auto items-stretch sm:items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleDelete(item.id)}
                                disabled={isDeleting}
                                className="w-full sm:w-auto min-h-9 sm:min-h-8 flex items-center justify-center gap-1 px-2.5 py-1.5 sm:py-1 rounded-lg bg-destructive text-white font-semibold cursor-pointer disabled:opacity-60 text-[11px] sm:text-xs transition-colors"
                              >
                                {isDeleting ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Trash2 className="w-3 h-3" />
                                )}
                                <span>تأكيد</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                disabled={isDeleting}
                                className="w-full sm:w-auto min-h-9 sm:min-h-8 px-2.5 py-1.5 sm:py-1 rounded-lg border border-border text-foreground cursor-pointer hover:bg-accent/40 text-[11px] sm:text-xs transition-colors"
                              >
                                إلغاء
                              </button>
                            </div>
                          </>
                        ) : (
                          <>
                            <span className="flex items-center gap-1 font-mono text-[11px] sm:text-xs">
                              <Calendar className="w-3 h-3 text-primary" />
                              {item.date ? String(item.date).split("T")[0] : ""}
                            </span>

                            <div className="flex flex-col sm:flex-row w-full sm:w-auto items-stretch sm:items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleEditClick(item)}
                                className="w-full sm:w-auto min-h-9 sm:min-h-8 flex items-center justify-center gap-1 text-primary font-semibold cursor-pointer bg-primary/10 hover:bg-primary/15 px-2.5 py-1.5 sm:py-1 rounded-lg border border-primary/20 transition-colors text-[11px] sm:text-xs"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>تعديل / إضافة تعليق</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(item.id)}
                                aria-label="مسح البوست"
                                className="w-full sm:w-auto min-h-9 sm:min-h-8 flex items-center justify-center gap-1 text-destructive font-semibold cursor-pointer bg-destructive/10 hover:bg-destructive/15 px-2.5 py-1.5 sm:py-1 rounded-lg border border-destructive/20 transition-colors text-[11px] sm:text-xs"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>مسح</span>
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}

          {successText && (
            <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-emerald-400 flex items-center justify-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-bold">{successText}</span>
            </div>
          )}
        </section>

        {/* 3. فورم إضافة / تعديل بوست أو ذكرى جديدة */}
        <section>
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className={`bg-card/95 backdrop-blur-xl border rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-xl space-y-4 transition-colors ${
              editingId ? "border-primary/60" : "border-border"
            }`}
          >
            <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-border/60">
              <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-1.5">
                <MessageSquareHeart className="w-4 h-4 text-primary" />
                <span>{editingId ? "تعديل البوست ✏️" : "أضف بوست أو ذكرى جديدة ✨"}</span>
              </h3>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex items-center gap-1 text-[11px] sm:text-xs text-destructive hover:underline cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  إلغاء التعديل
                </button>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-foreground">
                صورة البوست
              </label>
              <label className="flex flex-col items-center justify-center w-full h-32 sm:h-36 border-2 border-dashed border-border rounded-xl sm:rounded-2xl cursor-pointer bg-background/50 hover:bg-accent/30 transition-colors overflow-hidden">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-muted-foreground gap-1">
                    <ImagePlus className="w-6 h-6 text-primary" />
                    <span className="text-[11px] sm:text-xs">
                      اضغط لاختيار صورة من جهازك
                    </span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* خانات كتابة كلام مجدي ومنه */}
            <div className="space-y-5">

              {/* كابتشن مجدي */}
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                <label className="flex items-center gap-2 text-sm font-extrabold text-primary">
                  <User className="w-4 h-4" />
                  مجدي
                </label>

                <textarea
                  rows={4}
                  value={captionMagdy}
                  onChange={(e) => setCaptionMagdy(e.target.value)}
                  placeholder="اكتب كلام مجدي هنا..."
                  className="w-full rounded-xl bg-background border border-primary/20 px-4 py-3 text-sm text-foreground leading-relaxed text-right focus:outline-none focus:ring-2 focus:ring-primary resize-y min-h-28"
                  dir="rtl"
                />
              </div>

              {/* كابتشن منه */}
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 space-y-3">
                <label className="flex items-center gap-2 text-sm font-extrabold text-rose-500">
                  <Heart className="w-4 h-4" />
                  منه
                </label>

                <textarea
                  rows={4}
                  value={captionMena}
                  onChange={(e) => setCaptionMena(e.target.value)}
                  placeholder="اكتبي كلام منه هنا..."
                  className="w-full rounded-xl bg-background border border-rose-500/20 px-4 py-3 text-sm text-foreground leading-relaxed text-right focus:outline-none focus:ring-2 focus:ring-rose-500 resize-y min-h-28"
                  dir="rtl"
                />
              </div>

            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-foreground">
                التاريخ
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl bg-background border border-input px-3.5 py-2 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <p className="text-[10px] sm:text-[11px] text-muted-foreground">
                لو تركته فارغاً سيتم تسجيل تاريخ اليوم تلقائياً
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-3 px-5 rounded-xl sm:rounded-2xl bg-primary text-primary-foreground font-bold text-xs sm:text-sm shadow-md hover:opacity-95 transition-all cursor-pointer disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري النشر والحفظ...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{editingId ? "حفظ التعديلات" : "نشر البوست في الألبوم ❤️"}</span>
                </>
              )}
            </button>
          </form>
        </section>
      </div>

      {/* نافذة العرض المكبر (Lightbox) */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
          >
            <div
              className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="absolute -top-12 right-0 text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors cursor-pointer"
                aria-label="إغلاق"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={lightboxImage}
                alt="Expanded memory"
                className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl border border-white/10"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}