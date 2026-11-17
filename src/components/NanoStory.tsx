"use client";

import { motion } from "framer-motion";
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
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface NanoStoryProps {
  paragraphs: string[];
}

interface MemoryItem {
  id: string;
  image: string;
  caption: string;
  date: string;
  createdAt: number;
}

const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 400;
        const targetWidth = Math.min(MAX_WIDTH, img.width);
        const scaleSize = targetWidth / img.width;
        canvas.width = targetWidth;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.6));
      };
    };
  });
};

export default function NanoStory({ paragraphs }: NanoStoryProps) {
  let globalWordIndex = 0;

  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successText, setSuccessText] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [caption, setCaption] = useState("");
  const [date, setDate] = useState("");

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const formRef = useRef<HTMLFormElement | null>(null);

  const showSuccess = (text: string) => {
    setSuccessText(text);
    setTimeout(() => setSuccessText(""), 4000);
  };

  const fetchMemories = async () => {
    try {
      const res = await fetch(`/api/memories?t=${Date.now()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        const formatted = data
          .filter((item: any) => item.id && (item.caption || item.image))
          .map((item: any, index: number) => ({
            id: item.id ? String(item.id) : String(index + Date.now()),
            image: item.image || "",
            caption: item.caption || item.message || "",
            date: item.date || "",
            createdAt: item.createdAt ? Number(item.createdAt) : Date.now(),
          }));
        setMemories([...formatted].reverse());
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

  const postToSheet = async (payload: Record<string, unknown>) => {
    const SHEET_API_URL = process.env.NEXT_PUBLIC_SHEET_API_URL || "";
    await fetch(SHEET_API_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file);
    setImagePreview(compressed);
  };

  const resetForm = () => {
    setEditingId(null);
    setImagePreview("");
    setCaption("");
    setDate("");
  };

  const handleEditClick = (item: MemoryItem) => {
    setConfirmDeleteId(null);
    setEditingId(item.id);
    setImagePreview(item.image);
    setCaption(item.caption);
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
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imagePreview && !caption.trim()) return;

    setSubmitting(true);
    const today = new Date().toISOString().split("T")[0];
    const finalDate = date.trim() !== "" ? date : today;
    const currentTime = Date.now();
    const wasEditing = Boolean(editingId);

    const payload = {
      action: editingId ? "update" : "create",
      id: editingId || currentTime.toString(),
      image: imagePreview,
      caption,
      date: finalDate,
      createdAt: currentTime,
    };

    try {
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

      {/* تحسين الحاويات والعرض لتكون ملمومة ومناسبة جداً للموبايل واللابتوب */}
      <div className="relative z-10 mx-auto w-full max-w-xl sm:max-w-2xl px-4 sm:px-6 py-8 sm:py-14 space-y-10 sm:space-y-14">
        
        {/* 1. كارت الرسالة الأساسية */}
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
            {paragraphs.map((paragraph, pIdx) => {
              const words = paragraph.split(" ");
              return (
                <p key={pIdx} className="flex flex-wrap justify-start gap-x-1.5 gap-y-1">
                  {words.map((word, wIdx) => {
                    const currentDelay = globalWordIndex * 0.04;
                    globalWordIndex++;
                    const randomX = ((wIdx * 17) % 15) - 7;
                    const randomY = ((pIdx * 13 + wIdx) % 12) - 6;

                    return (
                      <motion.span
                        key={`${pIdx}-${wIdx}`}
                        initial={{ opacity: 0, x: randomX, y: randomY, scale: 1.15, filter: "blur(4px)" }}
                        animate={{ opacity: 1, x: 0, y: 0, scale: 1, filter: "blur(0px)" }}
                        transition={{ duration: 0.35, delay: currentDelay, ease: [0.22, 1, 0.36, 1] }}
                        className="relative inline-block"
                      >
                        {word}
                      </motion.span>
                    );
                  })}
                </p>
              );
            })}
          </div>
        </motion.section>

        {/* فاصل توضيحي لمكان البوستات والذكريات */}
        <div className="text-center space-y-1.5 pt-2">
          <div className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 px-3 py-1 rounded-full text-primary text-[11px] sm:text-xs font-bold">
            <MessageSquareHeart className="w-3.5 h-3.5" />
            <span>مساحة البوستات وذكرياتنا المشتركة</span>
          </div>
          <h2 className="text-lg sm:text-2xl font-bold text-foreground">
            ألبوم ذكرياتنا الحلوة 📸❤️
          </h2>
          <p className="text-xs text-muted-foreground max-w-xs sm:max-w-sm mx-auto">
            هنا مكان البوستات واللحظات اللي بنوثقها سوا.
          </p>
        </div>

        {/* 2. ألبوم الذكريات والبوستات */}
        <section className="space-y-6">
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : memories.length === 0 ? (
            <div className="flex flex-col items-center gap-2.5 py-10 text-center text-muted-foreground border-2 border-dashed border-border rounded-2xl sm:rounded-3xl bg-card/40 px-4">
              <ImagePlus className="w-7 h-7 text-primary/70" />
              <p className="text-xs sm:text-sm">لسه مفيش بوستات أو ذكريات، ابدأ بأول ذكرى من الفورم أدناه</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5">
              {memories.map((item) => {
                const isConfirming = confirmDeleteId === item.id;
                const isDeleting = deletingId === item.id;
                
                const imageSrc = item.image 
                  ? (item.image.startsWith("data:image") ? item.image : `data:image/jpeg;base64,${item.image}`) 
                  : "";

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
                    {imageSrc && (
                      <div className="relative w-full aspect-video bg-muted overflow-hidden">
                        <img
                          src={imageSrc}
                          alt={item.caption}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}

                    <div className="p-4 sm:p-5 flex-1 flex flex-col gap-3">
                      <p className="flex-1 text-sm sm:text-base font-medium text-foreground leading-relaxed whitespace-pre-line break-words">
                        {item.caption}
                      </p>

                      {/* شريط الأزرار والتاريخ بحجم متناسق جداً للموبايل واللابتوب */}
                      <div className="pt-2.5 border-t border-border/60 flex items-center justify-between gap-2 text-xs text-muted-foreground min-h-[2.25rem]">
                        {isConfirming ? (
                          <>
                            <span className="font-semibold text-destructive text-xs">مسح البوست ده؟</span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleDelete(item.id)}
                                disabled={isDeleting}
                                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-destructive text-white font-semibold cursor-pointer disabled:opacity-60 text-[11px]"
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
                                className="px-2.5 py-1 rounded-md border border-border text-foreground cursor-pointer hover:bg-accent/40 text-[11px]"
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

                            {/* أزرار التعديل والحذف بحجم صغير ومناسب جداً للشاشات الصغيرة */}
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleEditClick(item)}
                                className="flex items-center gap-1 text-primary font-semibold cursor-pointer bg-primary/10 hover:bg-primary/15 px-2.5 py-1 rounded-md border border-primary/20 transition-colors text-[11px] sm:text-xs"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>تعديل</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(item.id)}
                                aria-label="مسح البوست"
                                className="flex items-center gap-1 text-destructive font-semibold cursor-pointer bg-destructive/10 hover:bg-destructive/15 px-2.5 py-1 rounded-md border border-destructive/20 transition-colors text-[11px] sm:text-xs"
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
              <label className="block text-xs font-medium text-foreground">صورة البوست</label>
              <label className="flex flex-col items-center justify-center w-full h-32 sm:h-36 border-2 border-dashed border-border rounded-xl sm:rounded-2xl cursor-pointer bg-background/50 hover:bg-accent/30 transition-colors overflow-hidden">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-contain p-2" />
                ) : (
                  <div className="flex flex-col items-center justify-center text-muted-foreground gap-1">
                    <ImagePlus className="w-6 h-6 text-primary" />
                    <span className="text-[11px] sm:text-xs">اضغط لاختيار صورة من جهازك</span>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-foreground">اكتب الكلام أو التفاصيل هنا</label>
              <textarea
                rows={3}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="اكتب هنا التفاصيل أو الشعور في اللحظة دي..."
                className="w-full rounded-xl bg-background border border-input px-3.5 py-2.5 text-xs sm:text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-foreground">التاريخ</label>
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
    </motion.div>
  );
}