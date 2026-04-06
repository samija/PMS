import 'package:intl/intl.dart';

class EtbFormatter {
  EtbFormatter._();

  static final _currencyFormat = NumberFormat.currency(
    symbol: 'ETB ',
    decimalDigits: 2,
  );

  static String format(num amount) => _currencyFormat.format(amount);

  static String formatCompact(num amount) {
    if (amount >= 1000000) {
      return 'ETB ${(amount / 1000000).toStringAsFixed(1)}M';
    }
    if (amount >= 1000) {
      return 'ETB ${(amount / 1000).toStringAsFixed(1)}K';
    }
    return format(amount);
  }
}

class DateHelper {
  DateHelper._();

  static String formatDate(String isoDate) {
    final date = DateTime.parse(isoDate);
    return DateFormat('MMM dd, yyyy').format(date);
  }

  static String formatDateTime(String isoDate) {
    final date = DateTime.parse(isoDate);
    return DateFormat('MMM dd, yyyy • h:mm a').format(date);
  }

  static String timeAgo(String isoDate) {
    final date = DateTime.parse(isoDate);
    final diff = DateTime.now().difference(date);
    if (diff.inDays > 30) return DateFormat('MMM dd').format(date);
    if (diff.inDays > 0) return '${diff.inDays}d ago';
    if (diff.inHours > 0) return '${diff.inHours}h ago';
    if (diff.inMinutes > 0) return '${diff.inMinutes}m ago';
    return 'Just now';
  }

  static String monthYear(int month, int year) {
    final date = DateTime(year, month);
    return DateFormat('MMMM yyyy').format(date);
  }
}
